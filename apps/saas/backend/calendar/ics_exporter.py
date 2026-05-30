"""
ICS Exporter

Generate ICS (iCalendar) files for appointment export
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import io
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)


@dataclass
class AppointmentExport:
    """Appointment data for export"""
    id: str
    title: str
    description: str
    location: str
    start: datetime
    end: datetime
    status: str
    client_name: str
    employee_name: str
    service_name: str
    price: float
    created_at: datetime
    notes: str = None
    client_email: str = None
    client_phone: str = None


class ICSExporter:
    """
    Export appointments to ICS (iCalendar) format
    
    Features:
    - VCALENDAR standard format (RFC 5545)
    - Include all appointment details
    - Timezone conversion
    - UTF-8 encoding
    - Stream support for large exports
    - Multiple appointment filtering
    """
    
    # ICS format constants
    ICS_VERSION = "2.0"
    PRODUCT_ID = "-//BarberZap//Appointment Calendar//PT-BR"
    ICS_MIME_TYPE = "text/calendar;charset=utf-8"
    
    # Map status to ICS status
    STATUS_MAP = {
        'scheduled': 'TENTATIVE',
        'confirmed': 'CONFIRMED',
        'completed': 'CONFIRMED',
        'cancelled': 'CANCELLED',
        'no_show': 'CANCELLED',
    }
    
    # Map status to ICS method
    METHOD_MAP = {
        'scheduled': 'PUBLISH',
        'confirmed': 'PUBLISH',
        'completed': 'PUBLISH',
        'cancelled': 'CANCEL',
        'no_show': 'CANCEL',
    }
    
    def __init__(self, timezone: str = 'America/Sao_Paulo'):
        """
        Initialize ICS Exporter
        
        Args:
            timezone: Default timezone for event times
        """
        self.timezone = timezone
        
        try:
            self.tzinfo = ZoneInfo(timezone)
        except Exception:
            logger.warning(f"Timezone {timezone} not found, using UTC")
            self.tzinfo = ZoneInfo('UTC')
    
    # =====================================================
    # SINGLE APPOINTMENT EXPORT
    # =====================================================
    
    def export_appointment(self, appointment: Dict) -> str:
        """
        Export a single appointment to ICS format
        
        Args:
            appointment: Appointment data dictionary
            
        Returns:
            ICS string
        """
        export_data = self._parse_appointment(appointment)
        events = [self._build_event(export_data)]
        
        return self._build_calendar(events)
    
    # =====================================================
    # MULTIPLE APPOINTMENTS EXPORT
    # =====================================================
    
    def export_appointments(
        self,
        appointments: List[Dict],
        from_date: datetime = None,
        to_date: datetime = None,
        status_filter: List[str] = None,
    ) -> str:
        """
        Export multiple appointments to ICS format
        
        Args:
            appointments: List of appointment dictionaries
            from_date: Filter appointments after this date
            to_date: Filter appointments before this date
            status_filter: Filter by status list
            
        Returns:
            ICS string with all events
        """
        events = []
        
        for apt_dict in appointments:
            # Parse appointment
            export_data = self._parse_appointment(apt_dict)
            
            # Apply filters
            if from_date and export_data.start < from_date:
                continue
            if to_date and export_data.end > to_date:
                continue
            if status_filter and export_data.status not in status_filter:
                continue
            
            events.append(self._build_event(export_data))
        
        return self._build_calendar(events)
    
    # =====================================================
    # STREAM EXPORT
    # =====================================================
    
    def stream_ics_file(
        self,
        appointments: List[Dict],
        from_date: datetime = None,
        to_date: datetime = None,
        status_filter: List[str] = None,
    ) -> io.StringIO:
        """
        Create a StringIO object with ICS content for streaming/download
        
        Args:
            appointments: List of appointment dictionaries
            from_date: Filter appointments after this date
            to_date: Filter appointments before this date
            status_filter: Filter by status list
            
        Returns:
            StringIO object with ICS content
        """
        ics_content = self.export_appointments(
            appointments=appointments,
            from_date=from_date,
            to_date=to_date,
            status_filter=status_filter,
        )
        
        return io.StringIO(ics_content)
    
    # =====================================================
    # HELPER METHODS
    # =====================================================
    
    def _parse_appointment(self, appointment: Dict) -> AppointmentExport:
        """Parse appointment dictionary to export data"""
        scheduled_at = appointment.get('scheduled_at')
        if isinstance(scheduled_at, str):
            scheduled_at = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
        
        duration = appointment.get('duration_minutes', 60)
        end_time = scheduled_at + timedelta(minutes=duration)
        
        created_at = appointment.get('created_at')
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        # Build title
        service_name = appointment.get('service_name', 'Corte de Cabelo')
        client_name = appointment.get('client_name', 'Cliente')
        title = f"{service_name} - {client_name}"
        
        return AppointmentExport(
            id=appointment.get('id'),
            title=title,
            description=self._build_description(appointment),
            location=appointment.get('shop_name', 'BarberZap'),
            start=scheduled_at,
            end=end_time,
            status=appointment.get('status', 'scheduled'),
            client_name=client_name,
            employee_name=appointment.get('employee_name', ''),
            service_name=service_name,
            price=appointment.get('price', 0.0),
            created_at=created_at,
            notes=appointment.get('notes'),
            client_email=appointment.get('client_email'),
            client_phone=appointment.get('client_phone'),
        )
    
    def _build_calendar(self, events: List[str]) -> str:
        """Build complete ICALENDAR string with events"""
        lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            f'PRODID:{self.PRODUCT_ID}',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
        ]
        
        # Add all events
        lines.extend(events)
        
        lines.append('END:VCALENDAR')
        
        return '\r\n'.join(lines)
    
    def _build_event(self, appointment: AppointmentExport) -> str:
        """Build VEVENT string from appointment"""
        lines = [
            'BEGIN:VEVENT',
            f'UID:{appointment.id}@barberzap.com',
            f'DTSTAMP:{self._format_ics_datetime(appointment.created_at)}',
            f'DTSTART:{self._format_ics_datetime(appointment.start)}',
            f'DTEND:{self._format_ics_datetime(appointment.end)}',
            f'SUMMARY:{self._escape_ics_text(appointment.title)}',
            f'DESCRIPTION:{self._escape_ics_text(appointment.description)}',
            f'LOCATION:{self._escape_ics_text(appointment.location)}',
            f'STATUS:{self.STATUS_MAP.get(appointment.status, "TENTATIVE")}',
            f'CLASS:PUBLIC',
            f'TRANSP:OPAQUE',
        ]
        
        # Add attendees if email available
        if appointment.client_email:
            lines.extend([
                f'ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:{appointment.client_email}',
            ])
        
        # Add alarm (reminder)
        lines.extend([
            'BEGIN:VALARM',
            'TRIGGER:-PT24H',
            'ACTION:DISPLAY',
            f'DESCRIPTION:{self._escape_ics_text(appointment.title)}',
            'END:VALARM',
        ])
        
        lines.append('END:VEVENT')
        
        return '\r\n'.join(lines)
    
    def _build_description(self, appointment: Dict) -> str:
        """Build detailed description for appointment"""
        lines = [
            f"📅 Agendamento BarberZap",
            f"",
            f"👤 Cliente: {appointment.get('client_name', 'N/A')}",
            f"✂️ Serviço: {appointment.get('service_name', 'N/A')}",
            f"💈 Profissional: {appointment.get('employee_name', 'N/A')}",
            f"💰 Preço: R$ {appointment.get('price', 0):.2f}",
            f"",
            f"✅ Status: {self._format_status(appointment.get('status', 'N/A'))}",
        ]
        
        # Add contact info
        if appointment.get('client_email'):
            lines.append(f"📧 Email: {appointment['client_email']}")
        if appointment.get('client_phone'):
            lines.append(f"📱 Telefone: {appointment['client_phone']}")
        
        # Add notes if available
        if appointment.get('notes'):
            lines.extend([
                f"",
                f"📝 Observações:",
                f"{appointment['notes']}",
            ])
        
        lines.extend([
            f"",
            f"ID: {appointment.get('id')}",
            f"Gerado por BarberZap",
        ])
        
        return "\n".join(lines)
    
    def _format_ics_datetime(self, dt: datetime) -> str:
        """Format datetime to ICS format: YYYYMMDDTHHmmssZ"""
        # Convert to UTC
        if dt.tzinfo:
            dt_utc = dt.astimezone(ZoneInfo('UTC'))
        else:
            dt_utc = dt.replace(tzinfo=ZoneInfo('UTC'))
        
        return dt_utc.strftime("%Y%m%dT%H%M%SZ")
    
    def _format_status(self, status: str) -> str:
        """Format status for display"""
        status_map = {
            'scheduled': '✓ Agendado',
            'confirmed': '✓ Confirmado',
            'completed': '✓ Concluído',
            'cancelled': '✗ Cancelado',
            'no_show': '✗ Não compareceu',
        }
        return status_map.get(status, status)
    
    def _escape_ics_text(self, text: str) -> str:
        """
        Escape text for ICS format
        According to RFC 5545:
        - Backslash (\) must be escaped as \\
        - Double quotes (") must be escaped as \"
        - Comma (,) must be escaped as \,
        - Semicolon (;) must be escaped as \;
        - Newlines must be escaped as \n
        """
        if not text:
            return ""
        
        # Replace newlines with \n first
        text = text.replace('\r\n', '\n').replace('\n', '\\n')
        
        # Escape special characters
        text = text.replace('\\', '\\\\')
        text = text.replace('"', '\\"')
        text = text.replace(',', '\\,')
        text = text.replace(';', '\\;')
        
        # Remove carriage returns
        text = text.replace('\r', '')
        
        return text
    
    # =====================================================
    # FILE GENERATION
    # =====================================================
    
    def save_to_file(
        self,
        appointments: List[Dict],
        filename: str,
        from_date: datetime = None,
        to_date: datetime = None,
        status_filter: List[str] = None,
    ) -> str:
        """
        Export appointments to ICS file
        
        Args:
            appointments: List of appointment dictionaries
            filename: Output filename
            from_date: Filter appointments after this date
            to_date: Filter appointments before this date
            status_filter: Filter by status list
            
        Returns:
            Path to created file
        """
        ics_content = self.export_appointments(
            appointments=appointments,
            from_date=from_date,
            to_date=to_date,
            status_filter=status_filter,
        )
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(ics_content)
        
        logger.info(f"Exported {len(appointments)} appointments to {filename}")
        return filename
    
    # =====================================================
    # VALIDATION
    # =====================================================
    
    @staticmethod
    def validate_ics_content(ics_content: str) -> tuple[bool, str]:
        """
        Validate ICS content
        
        Args:
            ics_content: ICS string to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not ics_content:
            return False, "Empty ICS content"
        
        # Check for required components
        if 'BEGIN:VCALENDAR' not in ics_content:
            return False, "Missing BEGIN:VCALENDAR"
        
        if 'END:VCALENDAR' not in ics_content:
            return False, "Missing END:VCALENDAR"
        
        if 'BEGIN:VEVENT' not in ics_content:
            return False, "Missing BEGIN:VEVENT"
        
        if 'END:VEVENT' not in ics_content:
            return False, "Missing END:VEVENT"
        
        if 'VERSION:' not in ics_content:
            return False, "Missing VERSION"
        
        if 'PRODID:' not in ics_content:
            return False, "Missing PRODID"
        
        return True, ""
    
    @staticmethod
    def get_ics_mimetype() -> str:
        """Get ICS MIME type"""
        return ICSExporter.ICS_MIME_TYPE
    
    @staticmethod
    def generate_filename(prefix: str = "barberzap-calendar") -> str:
        """Generate filename with timestamp"""
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        return f"{prefix}-{timestamp}.ics"


# =====================================================
# FACTORY FUNCTIONS
# =====================================================

def create_ics_export_exporter(timezone: str = 'America/Sao_Paulo') -> ICSExporter:
    """
    Factory function to create ICS exporter
    
    Args:
        timezone: Timezone for event times
        
    Returns:
        ICSExporter instance
    """
    return ICSExporter(timezone=timezone)


def export_appointments_to_ics(
    appointments: List[Dict],
    timezone: str = 'America/Sao_Paulo',
    from_date: datetime = None,
    to_date: datetime = None,
    status_filter: List[str] = None,
) -> str:
    """
    Quick function to export appointments to ICS
    
    Args:
        appointments: List of appointment dictionaries
        timezone: Timezone for event times
        from_date: Filter appointments after this date
        to_date: Filter appointments before this date
        status_filter: Filter by status list
        
    Returns:
        ICS string
    """
    exporter = ICSExporter(timezone=timezone)
    return exporter.export_appointments(
        appointments=appointments,
        from_date=from_date,
        to_date=to_date,
        status_filter=status_filter,
    )
