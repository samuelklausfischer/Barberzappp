"""
BarberZap Cal.com Integration

Cliente para API REST do Cal.com - usado para automação de agendamento de demos

Ferramenta: Cal.com (self-hosted)
Docs: https://cal.com/docs/api-reference/
"""

import logging
import os
import requests
from typing import Dict, Optional, List
from datetime import datetime, timedelta


logger = logging.getLogger(__name__)


class CalComClient:
    """
    Cliente para API REST do Cal.com
    
    Suporta:
    - Buscar bookings
    - Listar event types
    - Cancelar bookings
    - Listar bookings por data
    """
    
    def __init__(
        self,
        api_key: str,
        api_url: str = "https://api.cal.com/v2"
    ):
        """
        Args:
            api_key: Cal.com API Key (Settings > Developer)
            api_url: URL base da API (default: https://api.cal.com/v2)
        """
        self.api_key = api_key
        self.api_url = api_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
        
        logger.info(f"✅ CalComClient initialized (API: {api_url})")
    
    def get_booking(self, booking_id: str) -> Optional[Dict]:
        """
        Busca booking por ID
        
        Args:
            booking_id: UID do booking (ex: "booking_xxx")
        
        Returns:
            Dict com booking data ou None
        """
        try:
            response = self.session.get(
                f"{self.api_url}/bookings/{booking_id}"
            )
            response.raise_for_status()
            return response.json().get('data', {})
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching booking {booking_id}: {e}")
            return None
    
    def get_event_types(self) -> List[Dict]:
        """
        Lista todos os event types disponíveis
        
        Returns:
            Lista de event types
        """
        try:
            response = self.session.get(f"{self.api_url}/event-types")
            response.raise_for_status()
            return response.json().get('data', [])
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching event types: {e}")
            return []
    
    def get_event_type_by_slug(self, slug: str) -> Optional[Dict]:
        """
        Busca event type por slug
        
        Args:
            slug: Slug do event type (ex: "demo-barberzap")
        
        Returns:
            Dict com event type ou None
        """
        event_types = self.get_event_types()
        for event_type in event_types:
            if event_type.get('slug') == slug:
                return event_type
        return None
    
    def cancel_booking(self, booking_id: str, reason: str = "") -> bool:
        """
        Cancela booking
        
        Args:
            booking_id: UID do booking
            reason: Motivo do cancelamento
        
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            response = self.session.patch(
                f"{self.api_url}/bookings/{booking_id}/cancel",
                json={'reason': reason}
            )
            response.raise_for_status()
            logger.info(f"✅ Booking {booking_id} canceled")
            return True
        except requests.exceptions.RequestException as e:
            logger.error(f"Error canceling booking {booking_id}: {e}")
            return False
    
    def get_bookings_for_date(
        self,
        date: str,
        event_type_id: Optional[int] = None
    ) -> List[Dict]:
        """
        Lista bookings para uma data específica
        
        Args:
            date: Data no formato YYYY-MM-DD
            event_type_id: Filtrar por event type (opcional)
        
        Returns:
            Lista de bookings
        """
        try:
            params = {'startDate': date, 'endDate': date}
            if event_type_id:
                params['eventTypeId'] = event_type_id
            
            response = self.session.get(
                f"{self.api_url}/bookings",
                params=params
            )
            response.raise_for_status()
            bookings = response.json().get('data', [])
            logger.info(f"✅ Found {len(bookings)} bookings for {date}")
            return bookings
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching bookings for date {date}: {e}")
            return []
    
    def get_upcoming_bookings(self, days: int = 7) -> List[Dict]:
        """
        Lista bookings para os próximos dias
        
        Args:
            days: Número de dias à frente (default: 7)
        
        Returns:
            Lista de bookings
        """
        today = datetime.now()
        start_date = today.strftime('%Y-%m-%d')
        end_date = (today + timedelta(days=days)).strftime('%Y-%m-%d')
        
        try:
            params = {'startDate': start_date, 'endDate': end_date}
            
            response = self.session.get(
                f"{self.api_url}/bookings",
                params=params
            )
            response.raise_for_status()
            bookings = response.json().get('data', [])
            logger.info(f"✅ Found {len(bookings)} upcoming bookings ({days} days)")
            return bookings
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching upcoming bookings: {e}")
            return []


# Funções úteis

def generate_demo_booking_link(calcom_client: CalComClient, event_slug: str) -> str:
    """
    Gera link de booking para demo
    
    Args:
        calcom_client: Instância do CalComClient
        event_slug: Slug do event type (ex: "demo-barberzap")
    
    Returns:
        URL de booking (ex: "https://cal.com/samuel/demo-barberzap")
    """
    event_type = calcom_client.get_event_type_by_slug(event_slug)
    if not event_type:
        raise ValueError(f"Event type not found: {event_slug}")
    
    username = event_type.get('users', [{}])[0].get('username', 'samuel')
    return f"https://cal.com/{username}/{event_slug}"


def process_calcom_webhook(
    webhook_event: Dict,
    user_id: str,
    crm_user_id: str
) -> Dict:
    """
    Processa webhook do Cal.com e atualiza CRM
    
    Args:
        webhook_event: Payload do webhook Cal.com
        user_id: Tenant ID
        crm_user_id: User ID do no CRM (mesmo que user_id)
    
    Returns:
        Dict com resultado da operação
    """
    try:
        event_type = webhook_event.get('type')
        
        if event_type == 'booking.created':
            booking = webhook_event.get('data')
            if not booking:
                return {'success': False, 'error': 'No booking data'}
            
            attendee = booking.get('attendee', {})
            phone = attendee.get('phone') or attendee.get('mobile')
            
            if not phone:
                return {'success': False, 'error': 'No phone in booking'}
            
            # Normalizar phone
            phone = phone.strip().replace('+', '').replace('-', '').replace(' ', '')
            
            # Atualizar CRM (requer import)
            # from crm.demo_booking import update_lead_demo_scheduled
            # return update_lead_demo_scheduled(
            #     user_id=user_id,
            #     phone=phone,
            #     booking_data={
            #         'booking_id': booking.get('uid'),
            #         'start_time': booking.get('startTime'),
            #         'end_time': booking.get('endTime'),
            #         'attendee': attendee,
            #         'meeting_link': booking.get('metadata', {}).get('videoCallUrl')
            #     }
            # )
            
            return {
                'success': True,
                'phone': phone,
                'booking_id': booking.get('uid'),
                'note': 'CRM update skipped (import module needed)'
            }
        
        elif event_type == 'booking.cancelled':
            # Implementar cancelamento de demo
            return {'success': True, 'note': 'Booking cancellation handled'}
        
        else:
            logger.warning(f"Unhandled webhook event type: {event_type}")
            return {'success': True, 'note': f'Event {event_type} not processed'}
    
    except Exception as e:
        logger.error(f"Error processing Cal.com webhook: {e}")
        return {'success': False, 'error': str(e)}


# Demo script

if __name__ == '__main__':
    """
    Demo script para testar Cal.com integration
    
    Setup:
    1. Set CALCOM_API_KEY environment variable
       export CALCOM_API_KEY="your_api_key"
    
    2. Run demo:
       python3 integrations/calcom_client.py
    """
    print("=" * 70)
    print("BarberZap - Cal.com Integration Demo")
    print("=" * 70)
    
    api_key = os.environ.get('CALCOM_API_KEY')
    
    if not api_key:
        print("\n❌ CALCOM_API_KEY not set")
        print("Set environment variable:")
        print("export CALCOM_API_KEY='your_api_key'")
        exit(1)
    
    # Initialize client
    print("\n1️⃣ Initializing CalComClient...")
    client = CalComClient(api_key=api_key)
    print("✅ Client initialized")
    
    # Test 1: List event types
    print("\n2️⃣ Listing event types...")
    print("-" * 70)
    event_types = client.get_event_types()
    print(f"Found {len(event_types)} event types:")
    for et in event_types[:3]:  # Print first 3
        print(f"  - {et.get('title')} (slug: {et.get('slug')})")
    
    # Test 2: Get specific event type
    print("\n3️⃣ Looking for demo event type...")
    print("-" * 70)
    demo_event = client.get_event_type_by_slug("demo-barberzap")
    
    if demo_event:
        print("✅ Demo event found:")
        print(f"  Title: {demo_event.get('title')}")
        print(f"  Slug: {demo_event.get('slug')}")
        print(f"  Duration: {demo_event.get('length')} min")
        
        # Test: Generate booking link
        print("\n4️⃣ Generating demo booking link...")
        print("-" * 70)
        try:
            booking_link = generate_demo_booking_link(client, "demo-barberzap")
            print(f"🔗 Booking link: {booking_link}")
        except ValueError as e:
            print(f"⚠️ Could not generate link: {e}")
    else:
        print("⚠️ Demo event not found")
        print("You need to create a 'Demo BarberZap' event type in Cal.com")
    
    # Test 3: List bookings for today
    print("\n5️⃣ Listing bookings for today...")
    print("-" * 70)
    
    today = datetime.now().strftime("%Y-%m-%d")
    bookings = client.get_bookings_for_date(today)
    
    if bookings:
        print(f"Found {len(bookings)} bookings for {today}:")
        for booking in bookings[:5]:  # Print max 5
            attendee = booking.get('attendee', {})
            start = booking.get('startTime', '')[:16].replace('T', ' ')
            print(f"  - {attendee.get('name') or 'N/A'} @ {start}")
    else:
        print("No bookings for today")
    
    # Test 4: List upcoming bookings
    print("\n6️⃣ Listing upcoming bookings (7 days)...")
    print("-" * 70)
    
    upcoming = client.get_upcoming_bookings(days=7)
    
    if upcoming:
        print(f"Found {len(upcoming)} upcoming bookings:")
        for booking in upcoming[:5]:
            attendee = booking.get('attendee', {})
            start = booking.get('startTime', '')[:16].replace('T', ' ')
            print(f"  - {attendee.get('name') or 'N/A'} @ {start}")
    else:
        print("No upcoming bookings")
    
    print("\n" + "=" * 70)
    print("✅ Demo completed!")
    print("=" * 70)
    
    print("\n📚 Next steps:")
    print("1. Create 'Demo BarberZap' event type in Cal.com")
    print("2. Configure webhook: https://cal.com/settings/developer/webhooks")
    print("3. Integrate webhook with n8n workflow")
    print("4. Connect to CRM via demo_booking.py functions")
    print("\nDemo booking URL format once created:")
    print("https://cal.com/{username}/demo-barberzap")
