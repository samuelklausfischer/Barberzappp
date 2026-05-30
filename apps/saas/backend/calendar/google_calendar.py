"""
Google Calendar Service

Gerencia integração com Google Calendar API usando OAuth 2.0
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import httpx

from .exceptions import (
    CalendarIntegrationError,
    CalendarAuthError,
    CalendarSyncError,
    CalendarConflictError,
    CalendarInvalidTokenError,
    CalendarRateLimitError
)

logger = logging.getLogger(__name__)


@dataclass
class GoogleEvent:
    """Represents a Google Calendar event"""
    id: str
    summary: str
    description: str
    start: datetime
    end: datetime
    location: str
    attendees: List[Dict]
    color_id: Optional[str] = None
    status: str = 'confirmed'
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class OAuthCredentials:
    """OAuth 2.0 credentials"""
    client_id: str
    client_secret: str
    redirect_uri: str
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class GoogleCalendarService:
    """
    Service for Google Calendar integration
    
    Features:
    - OAuth 2.0 flow
    - Auto refresh tokens
    - CRUD operations
    - Conflict detection
    - Colored events by status
    - Error handling and retry
    """
    
    # Google Calendar API endpoints
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3"
    
    # Event colors for different statuses
    COLORS = {
        'scheduled': '1',      # Blue
        'confirmed': '2',      # Green
        'completed': '3',      # Purple
        'cancelled': '4',      # Red
        'no_show': '5',        # Yellow
        'pending': '6',        # Orange
    }
    
    # Scopes needed
    SCOPES = [
        'https://www.googleapis.com/auth/calendar.events',
    ]
    
    def __init__(
        self,
        client_id: str = None,
        client_secret: str = None,
        redirect_uri: str = None,
    ):
        """
        Initialize Google Calendar service
        
        Args:
            client_id: OAuth client ID from Google Cloud Console
            client_secret: OAuth client secret
            redirect_uri: OAuth redirect URI
        """
        self.client_id = client_id or os.getenv('GOOGLE_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('GOOGLE_CLIENT_SECRET')
        self.redirect_uri = redirect_uri or os.getenv('GOOGLE_REDIRECT_URI', 'http://localhost:8000/auth/google/callback')
        
        if not all([self.client_id, self.client_secret]):
            raise CalendarIntegrationError(
                "Google OAuth credentials not configured. "
                "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables."
            )
        
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()
    
    # =====================================================
    # OAUTH 2.0 FLOW
    # =====================================================
    
    def get_auth_url(self, state: str = None) -> str:
        """
        Get OAuth authorization URL
        
        Args:
            state: OAuth state parameter for security
            
        Returns:
            Authorization URL
        """
        params = {
            'client_id': self.client_id,
            'redirect_uri': self.redirect_uri,
            'scope': ' '.join(self.SCOPES),
            'response_type': 'code',
            'access_type': 'offline',  # Get refresh token
            'prompt': 'consent',       # Force consent dialog for refresh token
        }
        
        if state:
            params['state'] = state
        
        # Build URL manually to ensure proper encoding
        auth_url = f"{self.AUTH_URL}?" + "&".join([f"{k}={v}" for k, v in params.items()])
        return auth_url
    
    async def exchange_code_for_tokens(
        self,
        code: str,
        state: str = None
    ) -> OAuthCredentials:
        """
        Exchange authorization code for tokens
        
        Args:
            code: Authorization code from OAuth flow
            state: OAuth state parameter (optional, for verification)
            
        Returns:
            OAuthCredentials object with access and refresh tokens
            
        Raises:
            CalendarAuthError: If token exchange fails
        """
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': self.redirect_uri,
        }
        
        try:
            response = await self.http_client.post(
                self.TOKEN_URL,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Calculate expiration time
            expires_in = token_data.get('expires_in', 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            credentials = OAuthCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                access_token=token_data['access_token'],
                refresh_token=token_data.get('refresh_token'),
                expires_at=expires_at,
            )
            
            logger.info("Successfully exchanged code for tokens")
            return credentials
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Token exchange failed: {e}")
            raise CalendarAuthError(f"Failed to exchange code for tokens: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token exchange: {e}")
            raise CalendarAuthError(f"Unexpected error: {e}")
    
    async def refresh_access_token(self, refresh_token: str) -> OAuthCredentials:
        """
        Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token from OAuth flow
            
        Returns:
            OAuthCredentials object with new access token
            
        Raises:
            CalendarAuthError: If token refresh fails
        """
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token',
        }
        
        try:
            response = await self.http_client.post(
                self.TOKEN_URL,
                data=data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            
            token_data = response.json()
            
            # Calculate expiration time
            expires_in = token_data.get('expires_in', 3600)
            expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
            
            credentials = OAuthCredentials(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                access_token=token_data['access_token'],
                refresh_token=refresh_token,  # Keep original refresh token
                expires_at=expires_at,
            )
            
            logger.info("Successfully refreshed access token")
            return credentials
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Token refresh failed: {e}")
            raise CalendarInvalidTokenError(f"Failed to refresh token: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {e}")
            raise CalendarAuthError(f"Unexpected error: {e}")
    
    async def get_valid_access_token(
        self,
        credentials: OAuthCredentials
    ) -> str:
        """
        Get a valid access token, refreshing if necessary
        
        Args:
            credentials: OAuthCredentials object
            
        Returns:
            Valid access token
            
        Raises:
            CalendarAuthError: If token cannot be obtained
        """
        # Check if token is still valid (with 5 minute buffer)
        if credentials.expires_at and credentials.expires_at > datetime.utcnow() + timedelta(minutes=5):
            return credentials.access_token
        
        # Token needs refresh
        if not credentials.refresh_token:
            raise CalendarInvalidTokenError(
                "Access token expired and no refresh token available. "
                "User needs to re-authenticate."
            )
        
        # Refresh token
        new_credentials = await self.refresh_access_token(credentials.refresh_token)
        
        # Update credentials
        credentials.access_token = new_credentials.access_token
        credentials.expires_at = new_credentials.expires_at
        
        return credentials.access_token
    
    # =====================================================
    # EVENT CRUD OPERATIONS
    # =====================================================
    
    async def create_event(
        self,
        calendar_id: str,
        summary: str,
        start: datetime,
        end: datetime,
        description: str = None,
        location: str = None,
        attendees: List[str] = None,
        color_id: str = None,
        credentials: OAuthCredentials = None,
        check_conflicts: bool = True,
    ) -> GoogleEvent:
        """
        Create a new event in Google Calendar
        
        Args:
            calendar_id: Google Calendar ID (use 'primary' for primary calendar)
            summary: Event title
            start: Event start time
            end: Event end time
            description: Event description
            location: Event location
            attendees: List of email addresses
            color_id: Event color ID (1-11)
            credentials: OAuth credentials
            check_conflicts: Whether to check for scheduling conflicts
            
        Returns:
            Created GoogleEvent
            
        Raises:
            CalendarConflictError: If conflict detected and check_conflicts=True
            CalendarSyncError: If event creation fails
        """
        # Check for conflicts
        if check_conflicts:
            conflicts = await self.check_conflicts(
                calendar_id=calendar_id,
                start=start,
                end=end,
                ignore_event_id=None,
                credentials=credentials
            )
            if conflicts:
                raise CalendarConflictError(
                    f"Scheduling conflict detected: {len(conflicts)} conflicting events",
                    conflicting_events=conflicts
                )
        
        # Build event payload
        event_data = self._build_event_data(
            summary=summary,
            start=start,
            end=end,
            description=description,
            location=location,
            attendees=attendees,
            color_id=color_id
        )
        
        # Get access token
        access_token = await self.get_valid_access_token(credentials)
        
        # Create event
        url = f"{self.CALENDAR_API_BASE}/calendars/{calendar_id}/events"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = await self.http_client.post(
                url,
                json=event_data,
                headers=headers
            )
            response.raise_for_status()
            
            event_json = response.json()
            event = self._parse_event(event_json)
            
            logger.info(f"Created event {event.id} in calendar {calendar_id}")
            return event
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to create event: {e}")
            raise CalendarSyncError(f"Failed to create event: {e}")
        except Exception as e:
            logger.error(f"Unexpected error creating event: {e}")
            raise CalendarSyncError(f"Unexpected error: {e}")
    
    async def update_event(
        self,
        calendar_id: str,
        event_id: str,
        summary: str = None,
        start: datetime = None,
        end: datetime = None,
        description: str = None,
        location: str = None,
        attendees: List[str] = None,
        color_id: str = None,
        credentials: OAuthCredentials = None,
        check_conflicts: bool = True,
    ) -> GoogleEvent:
        """
        Update an existing event in Google Calendar
        
        Args:
            calendar_id: Google Calendar ID
            event_id: Event ID to update
            summary: New event title
            start: New event start time
            end: New event end time
            description: New event description
            location: New event location
            attendees: New list of email addresses
            color_id: New event color ID
            credentials: OAuth credentials
            check_conflicts: Whether to check for scheduling conflicts
            
        Returns:
            Updated GoogleEvent
            
        Raises:
            CalendarConflictError: If conflict detected
            CalendarSyncError: If event update fails
        """
        # Get current event first
        current_event = await self.get_event(calendar_id, event_id, credentials)
        
        # Check for conflicts if times changed
        if check_conflicts and (start or end):
            conflict_start = start or current_event.start
            conflict_end = end or current_event.end
            
            conflicts = await self.check_conflicts(
                calendar_id=calendar_id,
                start=conflict_start,
                end=conflict_end,
                ignore_event_id=event_id,
                credentials=credentials
            )
            if conflicts:
                raise CalendarConflictError(
                    f"Scheduling conflict detected: {len(conflicts)} conflicting events",
                    conflicting_events=conflicts
                )
        
        # Build event payload
        event_data = {}
        if summary is not None:
            event_data['summary'] = summary
        if start is not None:
            event_data['start'] = {'dateTime': start.isoformat(), 'timeZone': 'UTC'}
        if end is not None:
            event_data['end'] = {'dateTime': end.isoformat(), 'timeZone': 'UTC'}
        if description is not None:
            event_data['description'] = description
        if location is not None:
            event_data['location'] = location
        if attendees is not None:
            event_data['attendees'] = [{'email': email} for email in attendees]
        if color_id is not None:
            event_data['colorId'] = color_id
        
        # Get access token
        access_token = await self.get_valid_access_token(credentials)
        
        # Update event
        url = f"{self.CALENDAR_API_BASE}/calendars/{calendar_id}/events/{event_id}"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        try:
            response = await self.http_client.patch(
                url,
                json=event_data,
                headers=headers
            )
            response.raise_for_status()
            
            event_json = response.json()
            event = self._parse_event(event_json)
            
            logger.info(f"Updated event {event_id} in calendar {calendar_id}")
            return event
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise CalendarIntegrationError(f"Event {event_id} not found")
            logger.error(f"Failed to update event: {e}")
            raise CalendarSyncError(f"Failed to update event: {e}")
        except Exception as e:
            logger.error(f"Unexpected error updating event: {e}")
            raise CalendarSyncError(f"Unexpected error: {e}")
    
    async def delete_event(
        self,
        calendar_id: str,
        event_id: str,
        credentials: OAuthCredentials = None,
    ) -> bool:
        """
        Delete an event from Google Calendar
        
        Args:
            calendar_id: Google Calendar ID
            event_id: Event ID to delete
            credentials: OAuth credentials
            
        Returns:
            True if successful
            
        Raises:
            CalendarSyncError: If event deletion fails
        """
        access_token = await self.get_valid_access_token(credentials)
        
        url = f"{self.CALENDAR_API_BASE}/calendars/{calendar_id}/events/{event_id}"
        headers = {
            'Authorization': f'Bearer {access_token}',
        }
        
        try:
            response = await self.http_client.delete(url, headers=headers)
            response.raise_for_status()
            
            logger.info(f"Deleted event {event_id} from calendar {calendar_id}")
            return True
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # Event doesn't exist, consider it deleted
                logger.warning(f"Event {event_id} not found, treating as deleted")
                return True
            logger.error(f"Failed to delete event: {e}")
            raise CalendarSyncError(f"Failed to delete event: {e}")
        except Exception as e:
            logger.error(f"Unexpected error deleting event: {e}")
            raise CalendarSyncError(f"Unexpected error: {e}")
    
    async def get_event(
        self,
        calendar_id: str,
        event_id: str,
        credentials: OAuthCredentials = None,
    ) -> GoogleEvent:
        """
        Get a specific event from Google Calendar
        
        Args:
            calendar_id: Google Calendar ID
            event_id: Event ID
            credentials: OAuth credentials
            
        Returns:
            GoogleEvent
            
        Raises:
            CalendarIntegrationError: If event not found
        """
        access_token = await self.get_valid_access_token(credentials)
        
        url = f"{self.CALENDAR_API_BASE}/calendars/{calendar_id}/events/{event_id}"
        headers = {
            'Authorization': f'Bearer {access_token}',
        }
        
        try:
            response = await self.http_client.get(url, headers=headers)
            response.raise_for_status()
            
            event_json = response.json()
            return self._parse_event(event_json)
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise CalendarIntegrationError(f"Event {event_id} not found")
            raise CalendarSyncError(f"Failed to get event: {e}")
    
    # =====================================================
    # LIST AND SYNC
    # =====================================================
    
    async def list_events(
        self,
        calendar_id: str,
        start: datetime = None,
        end: datetime = None,
        limit: int = 100,
        credentials: OAuthCredentials = None,
    ) -> List[GoogleEvent]:
        """
        List events from Google Calendar
        
        Args:
            calendar_id: Google Calendar ID
            start: Start of date range
            end: End of date range
            limit: Maximum number of events
            credentials: OAuth credentials
            
        Returns:
            List of GoogleEvent objects
        """
        access_token = await self.get_valid_access_token(credentials)
        
        url = f"{self.CALENDAR_API_BASE}/calendars/{calendar_id}/events"
        headers = {
            'Authorization': f'Bearer {access_token}',
        }
        params = {
            'maxResults': limit,
            'singleEvents': True,
            'orderBy': 'startTime',
        }
        
        if start:
            params['timeMin'] = start.isoformat() + 'Z'
        if end:
            params['timeMax'] = end.isoformat() + 'Z'
        
        try:
            response = await self.http_client.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            events = [self._parse_event(event) for event in data.get('items', [])]
            
            logger.info(f"Listed {len(events)} events from calendar {calendar_id}")
            return events
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to list events: {e}")
            raise CalendarSyncError(f"Failed to list events: {e}")
    
    async def sync_appointments(
        self,
        client_id: str,
        calendar_id: str,
        appointments: List[Dict] = None,
        credentials: OAuthCredentials = None,
        since_date: datetime = None,
    ) -> Dict[str, Any]:
        """
        Sync BarberZap appointments with Google Calendar
        
        Args:
            client_id: Client ID
            calendar_id: Google Calendar ID
            appointments: List of appointments to sync
            credentials: OAuth credentials
            since_date: Only sync appointments after this date
            
        Returns:
            Sync result with stats
        """
        results = {
            'created': 0,
            'updated': 0,
            'deleted': 0,
            'errors': 0,
            'conflicts': 0,
            'details': []
        }
        
        if not appointments:
            return results
        
        # Get existing events from Google Calendar
        existing_events = await self.list_events(
            calendar_id=calendar_id,
            start=since_date or datetime.utcnow() - timedelta(days=30),
            credentials=credentials
        )
        
        # Build map of appointment IDs to Google event IDs
        # (assuming we store the Google event ID in appointment metadata)
        
        for appointment in appointments:
            try:
                appointment_id = appointment.get('id')
                external_event_id = appointment.get('external_event_id')
                
                # Parse appointment times
                start_time = appointment.get('scheduled_at')
                duration = appointment.get('duration_minutes', 60)
                end_time = start_time + timedelta(minutes=duration)
                
                # Determine color based on status
                status = appointment.get('status', 'scheduled')
                color_id = self.COLORS.get(status, '1')
                
                # Build event details
                summary = self._build_summary(appointment)
                description = self._build_description(appointment)
                location = appointment.get('shop_name', 'BarberZap')
                
                attendees = []
                if appointment.get('client_email'):
                    attendees.append(appointment['client_email'])
                if appointment.get('employee_email'):
                    attendees.append(appointment['employee_email'])
                
                if external_event_id:
                    # Update existing event
                    await self.update_event(
                        calendar_id=calendar_id,
                        event_id=external_event_id,
                        summary=summary,
                        start=start_time,
                        end=end_time,
                        description=description,
                        location=location,
                        attendees=attendees,
                        color_id=color_id,
                        credentials=credentials
                    )
                    results['updated'] += 1
                    results['details'].append({
                        'appointment_id': appointment_id,
                        'action': 'updated',
                        'external_event_id': external_event_id
                    })
                else:
                    # Create new event
                    event = await self.create_event(
                        calendar_id=calendar_id,
                        summary=summary,
                        start=start_time,
                        end=end_time,
                        description=description,
                        location=location,
                        attendees=attendees,
                        color_id=color_id,
                        credentials=credentials
                    )
                    results['created'] += 1
                    results['details'].append({
                        'appointment_id': appointment_id,
                        'action': 'created',
                        'external_event_id': event.id
                    })
                    
            except CalendarConflictError as e:
                results['conflicts'] += 1
                results['details'].append({
                    'appointment_id': appointment.get('id'),
                    'action': 'conflict',
                    'error': str(e),
                    'conflicting_events': e.conflicting_events
                })
                logger.warning(f"Conflict detected for appointment: {e}")
                
            except Exception as e:
                results['errors'] += 1
                results['details'].append({
                    'appointment_id': appointment.get('id'),
                    'action': 'error',
                    'error': str(e)
                })
                logger.error(f"Failed to sync appointment: {e}")
        
        logger.info(f"Sync complete: {results}")
        return results
    
    # =====================================================
    # CONFLICT DETECTION
    # =====================================================
    
    async def check_conflicts(
        self,
        calendar_id: str,
        start: datetime,
        end: datetime,
        ignore_event_id: str = None,
        credentials: OAuthCredentials = None,
    ) -> List[Dict]:
        """
        Check for scheduling conflicts in Google Calendar
        
        Args:
            calendar_id: Google Calendar ID
            start: Event start time
            end: Event end time
            ignore_event_id: Event ID to ignore (for updates)
            credentials: OAuth credentials
            
        Returns:
            List of conflicting events
        """
        # Get events in date range
        events = await self.list_events(
            calendar_id=calendar_id,
            start=start - timedelta(minutes=30),
            end=end + timedelta(minutes=30),
            credentials=credentials
        )
        
        # Find conflicts
        conflicts = []
        for event in events:
            # Skip ignored event
            if ignore_event_id and event.id == ignore_event_id:
                continue
            
            # Skip cancelled events
            if event.status == 'cancelled':
                continue
            
            # Check for time overlap
            if self._is_time_overlap(start, end, event.start, event.end):
                conflicts.append({
                    'id': event.id,
                    'summary': event.summary,
                    'start': event.start.isoformat(),
                    'end': event.end.isoformat(),
                })
        
        return conflicts
    
    def _is_time_overlap(
        self,
        start1: datetime,
        end1: datetime,
        start2: datetime,
        end2: datetime
    ) -> bool:
        """Check if two time ranges overlap"""
        return max(start1, start2) < min(end1, end2)
    
    # =====================================================
    # HELPER METHODS
    # =====================================================
    
    def _build_event_data(
        self,
        summary: str,
        start: datetime,
        end: datetime,
        description: str = None,
        location: str = None,
        attendees: List[str] = None,
        color_id: str = None,
    ) -> Dict:
        """Build Google Calendar event data"""
        event_data = {
            'summary': summary,
            'start': {'dateTime': start.isoformat(), 'timeZone': 'UTC'},
            'end': {'dateTime': end.isoformat(), 'timeZone': 'UTC'},
        }
        
        if description:
            event_data['description'] = description
        if location:
            event_data['location'] = location
        if attendees:
            event_data['attendees'] = [{'email': email} for email in attendees]
        if color_id:
            event_data['colorId'] = color_id
        
        return event_data
    
    def _build_summary(self, appointment: Dict) -> str:
        """Build event summary from appointment"""
        service_name = appointment.get('service_name', 'Corte de Cabelo')
        client_name = appointment.get('client_name', 'Cliente')
        return f"{service_name} - {client_name}"
    
    def _build_description(self, appointment: Dict) -> str:
        """Build event description from appointment"""
        lines = [
            f"Agendamento BarberZap",
            f"",
            f"Cliente: {appointment.get('client_name', 'N/A')}",
            f"Serviço: {appointment.get('service_name', 'N/A')}",
            f"Profissional: {appointment.get('employee_name', 'N/A')}",
            f"Preço: R$ {appointment.get('price', 0):.2f}",
            f"",
            f"Status: {appointment.get('status', 'N/A')}",
        ]
        
        if appointment.get('notes'):
            lines.extend([
                f"",
                f"Observações:",
                f"{appointment['notes']}"
            ])
        
        lines.extend([
            f"",
            f"ID: {appointment.get('id')}"
        ])
        
        return "\n".join(lines)
    
    def _parse_event(self, event_json: Dict) -> GoogleEvent:
        """Parse Google Calendar API event JSON"""
        # Parse start/end times
        start_data = event_json.get('start', {})
        end_data = event_json.get('end', {})
        
        if 'dateTime' in start_data:
            start = datetime.fromisoformat(start_data['dateTime'].replace('Z', '+00:00'))
        else:
            start = datetime.fromisoformat(start_data['date'])
        
        if 'dateTime' in end_data:
            end = datetime.fromisoformat(end_data['dateTime'].replace('Z', '+00:00'))
        else:
            end = datetime.fromisoformat(end_data['date'])
        
        # Parse created/updated times
        created_at = None
        if event_json.get('created'):
            created_at = datetime.fromisoformat(event_json['created'].replace('Z', '+00:00'))
        
        updated_at = None
        if event_json.get('updated'):
            updated_at = datetime.fromisoformat(event_json['updated'].replace('Z', '+00:00'))
        
        return GoogleEvent(
            id=event_json['id'],
            summary=event_json.get('summary', 'Sem título'),
            description=event_json.get('description', ''),
            start=start,
            end=end,
            location=event_json.get('location', ''),
            attendees=event_json.get('attendees', []),
            color_id=event_json.get('colorId'),
            status=event_json.get('status', 'confirmed'),
            created_at=created_at,
            updated_at=updated_at,
        )
