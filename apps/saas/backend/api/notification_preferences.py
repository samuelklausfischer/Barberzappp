"""
BarberZap - Notification Preferences API

Gestão completa de preferências de notificação para clientes.
Inclui CRUD, preview, timezone awareness e integração com sistema de fila.
"""

import os
import asyncio
from datetime import datetime, time, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum

import asyncpg
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field, validator
from dateutil.tz import tz, get_timezone

from ..config.redis_config import RedisConfig
from ..error.exceptions import (
    BadRequestError,
    NotFoundError,
    ValidationError
)

# ==================== Enums ====================

class NotificationType(str, Enum):
    """Tipos de notificação suportados"""
    BOOKING_CONFIRMATION = "booking_confirmation"
    REMINDER_24H = "reminder_24h"
    REMINDER_2H = "reminder_2h"
    CANCELLATION = "cancellation"
    RESCHEDULE = "reschedule"
    PROMOTIONAL = "promotional"
    MONTHLY_REPORT = "monthly_report"

class ChannelType(str, Enum):
    """Canais de notificação"""
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    SMS = "sms"
    IN_APP = "in_app"
    NONE = "none"

class TimingType(str, Enum):
    """Timing preferido para envio"""
    INSTANT = "instant"
    ONE_HOUR_BEFORE = "1h_before"
    TWENTY_FOUR_HOURS_BEFORE = "24h_before"
    MORNING = "morning"
    AFTERNOON = "afternoon"
    EVENING = "evening"

# ==================== Pydantic Models ====================

class NotificationPreferenceBase(BaseModel):
    """Base model para preferências de notificação"""
    notification_type: NotificationType
    channel: ChannelType = Field(default=ChannelType.WHATSAPP)
    enabled: bool = Field(default=True)
    timing: TimingType = Field(default=TimingType.INSTANT)
    timezone: str = Field(default="America/Sao_Paulo")
    do_not_disturb_start: Optional[str] = Field(default=None)
    do_not_disturb_end: Optional[str] = Field(default=None)

    @validator('do_not_disturb_start', 'do_not_disturb_end')
    def validate_time_format(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, '%H:%M').time()
            except ValueError:
                raise ValueError("Time must be in HH:MM format")
        return v

class NotificationPreferenceCreate(NotificationPreferenceBase):
    """Model para criar preferências"""
    pass

class NotificationPreferenceUpdate(NotificationPreferenceBase):
    """Model para atualizar preferências"""
    pass

class NotificationPreference(NotificationPreferenceBase):
    """Model completo de preferências"""
    shop_id: str
    client_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ClientPreferencesResponse(BaseModel):
    """Resposta com todas as preferências de um cliente"""
    shop_id: str
    client_id: str
    preferences: List[NotificationPreference]
    shop_defaults: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class NotificationPreview(BaseModel):
    """Preview de notificação"""
    notification_type: NotificationType
    channel: ChannelType
    title: str
    message: str
    variables: Dict[str, Any]

class QueueNotificationRequest(BaseModel):
    """Request para enfileirar notificação com preferências"""
    appointment_id: str
    notification_type: NotificationType
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

# ==================== Database Connection ====================

async def get_db_connection():
    """Obtém conexão com o banco de dados"""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL not configured")
    
    return await asyncpg.connect(db_url)

# ==================== Repository ====================

class NotificationPreferencesRepository:
    """Repository para operações de preferências de notificação"""
    
    def __init__(self, db: asyncpg.Connection):
        self.db = db
    
    async def get_client_preferences(
        self,
        shop_id: str,
        client_id: str
    ) -> List[Dict[str, Any]]:
        """
        Obtém todas as preferências de notificação de um cliente.
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            
        Returns:
            Lista de preferências do cliente
        """
        query = """
        SELECT 
            shop_id,
            client_id,
            notification_type,
            channel,
            enabled,
            timing,
            timezone,
            do_not_disturb_start,
            do_not_disturb_end,
            created_at,
            updated_at
        FROM client_notification_preferences
        WHERE shop_id = $1 AND client_id = $2
        ORDER BY notification_type
        """
        
        rows = await self.db.fetch(query, shop_id, client_id)
        return [dict(row) for row in rows]
    
    async def get_client_preference(
        self,
        shop_id: str,
        client_id: str,
        notification_type: NotificationType
    ) -> Optional[Dict[str, Any]]:
        """
        Obtém preferência específica de um cliente.
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            notification_type: Tipo de notificação
            
        Returns:
            Preferência encontrada ou None
        """
        query = """
        SELECT 
            shop_id,
            client_id,
            notification_type,
            channel,
            enabled,
            timing,
            timezone,
            do_not_disturb_start,
            do_not_disturb_end,
            created_at,
            updated_at
        FROM client_notification_preferences
        WHERE shop_id = $1 
          AND client_id = $2 
          AND notification_type = $3
        """
        
        row = await self.db.fetchrow(query, shop_id, client_id, notification_type.value)
        return dict(row) if row else None
    
    async def upsert_client_preference(
        self,
        shop_id: str,
        client_id: str,
        preference: NotificationPreferenceCreate
    ) -> Dict[str, Any]:
        """
        Cria ou atualiza preferência de notificação.
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            preference: Dados da preferência
            
        Returns:
            Preferência criada/atualizada
        """
        query = """
        INSERT INTO client_notification_preferences (
            shop_id,
            client_id,
            notification_type,
            channel,
            enabled,
            timing,
            timezone,
            do_not_disturb_start,
            do_not_disturb_end
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
        )
        ON CONFLICT (shop_id, client_id, notification_type)
        DO UPDATE SET
            channel = EXCLUDED.channel,
            enabled = EXCLUDED.enabled,
            timing = EXCLUDED.timing,
            timezone = EXCLUDED.timezone,
            do_not_disturb_start = EXCLUDED.do_not_disturb_start,
            do_not_disturb_end = EXCLUDED.do_not_disturb_end,
            updated_at = NOW()
        RETURNING *
        """
        
        row = await self.db.fetchrow(
            query,
            shop_id,
            client_id,
            preference.notification_type.value,
            preference.channel.value,
            preference.enabled,
            preference.timing.value,
            preference.timezone,
            preference.do_not_disturb_start,
            preference.do_not_disturb_end
        )
        
        return dict(row)
    
    async def upsert_many_preferences(
        self,
        shop_id: str,
        client_id: str,
        preferences: List[NotificationPreferenceCreate]
    ) -> List[Dict[str, Any]]:
        """
        Cria ou atualiza múltiplas preferências.
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            preferences: Lista de preferências
            
        Returns:
            Lista de preferências atualizadas
        """
        results = []
        
        async with self.db.transaction():
            for pref in preferences:
                result = await self.upsert_client_preference(shop_id, client_id, pref)
                results.append(result)
        
        return results
    
    async def delete_client_preference(
        self,
        shop_id: str,
        client_id: str,
        notification_type: NotificationType
    ) -> bool:
        """
        Remove preferência de notificação (reseta para default).
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            notification_type: Tipo de notificação
            
        Returns:
            True se removido, False se não existia
        """
        query = """
        DELETE FROM client_notification_preferences
        WHERE shop_id = $1 
          AND client_id = $2 
          AND notification_type = $3
        """
        
        result = await self.db.execute(query, shop_id, client_id, notification_type.value)
        return result != "DELETE 0"
    
    async def get_shop_defaults(
        self,
        shop_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Obtém configurações padrão da barbearia.
        
        Args:
            shop_id: ID da barbearia
            
        Returns:
            Configurações padrão ou None
        """
        query = """
        SELECT * FROM shop_notification_defaults
        WHERE shop_id = $1
        """
        
        row = await self.db.fetchrow(query, shop_id)
        return dict(row) if row else None
    
    async def get_effective_preferences(
        self,
        shop_id: str,
        client_id: str,
        notification_type: NotificationType
    ) -> Dict[str, Any]:
        """
        Obtém preferências efetivas (com fallback para defaults da shop).
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            notification_type: Tipo de notificação
            
        Returns:
            Preferências efetivas
        """
        # Primeiro tenta obter preferência do cliente
        client_pref = await self.get_client_preference(shop_id, client_id, notification_type)
        
        # Obtém defaults da shop
        shop_defaults = await self.get_shop_defaults(shop_id)
        
        if not shop_defaults:
            # Se não tem defaults, usa valores padrão
            return {
                'shop_id': shop_id,
                'client_id': client_id,
                'notification_type': notification_type.value,
                'channel': ChannelType.WHATSAPP.value,
                'enabled': True,
                'timing': TimingType.INSTANT.value,
                'timezone': 'America/Sao_Paulo',
                'do_not_disturb_start': None,
                'do_not_disturb_end': None
            }
        
        # Apply defaults
        if client_pref:
            effective = client_pref.copy()
        else:
            effective = {
                'shop_id': shop_id,
                'client_id': client_id,
                'notification_type': notification_type.value,
                'channel': shop_defaults.get('default_channel', ChannelType.WHATSAPP.value),
                'enabled': shop_defaults.get(f'{notification_type.value}_enabled', True),
                'timing': shop_defaults.get(f'{notification_type.value}_timing', TimingType.INSTANT.value),
                'timezone': shop_defaults.get('default_timezone', 'America/Sao_Paulo'),
                'do_not_disturb_start': None,
                'do_not_disturb_end': None
            }
        
        return effective

# ==================== Service ====================

class NotificationPreferencesService:
    """Service para lógica de negócios de preferências"""
    
    def __init__(self, db: asyncpg.Connection, redis: RedisConfig):
        self.db = db
        self.redis = redis
        self.repo = NotificationPreferencesRepository(db)
    
    async def get_notification_channel(
        self,
        shop_id: str,
        client_id: str,
        notification_type: NotificationType,
        scheduled_at: datetime
    ) -> Optional[ChannelType]:
        """
        Determina o canal correto para envio baseado nas preferências.
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            notification_type: Tipo de notificação
            scheduled_at: Quando será enviada
            
        Returns:
            Canal a ser usado ou None se não deve enviar
        """
        pref = await self.repo.get_effective_preferences(shop_id, client_id, notification_type)
        
        # Verifica se está habilitado
        if not pref.get('enabled'):
            return None
        
        # Verifica período de silêncio
        if self.is_silent_period(pref, scheduled_at):
            return None
        
        return ChannelType(pref.get('channel', ChannelType.WHATSAPP.value))
    
    def is_silent_period(
        self,
        preference: Dict[str, Any],
        scheduled_at: datetime
    ) -> bool:
        """
        Verifica se horário está em período de não perturbar.
        
        Args:
            preference: Preferências do cliente
            scheduled_at: Horário agendado
            
        Returns:
            True se deve respeitar silêncio
        """
        dnd_start = preference.get('do_not_disturb_start')
        dnd_end = preference.get('do_not_disturb_end')
        
        if not dnd_start or not dnd_end:
            return False
        
        # Converte horário para timezone do cliente
        client_tz = get_timezone(preference.get('timezone', 'America/Sao_Paulo'))
        scheduled_local = scheduled_at.astimezone(client_tz)
        
        # Obtém horário local
        scheduled_time = scheduled_local.time()
        
        try:
            start = datetime.strptime(dnd_start, '%H:%M').time()
            end = datetime.strptime(dnd_end, '%H:%M').time()
            
            # Verifica se está no intervalo (considerando跨越 midnight)
            if start <= end:
                return start <= scheduled_time <= end
            else:
                # Intervalo que atravessa meia-noite
                return scheduled_time >= start or scheduled_time <= end
        except ValueError:
            return False
    
    def get_timezone_offset(
        self,
        client_id: str,
        scheduled_at: datetime
    ) -> int:
        """
        Calcula offset de timezone em horas.
        
        Args:
            client_id: ID do cliente
            scheduled_at: Horário agendado
            
        Returns:
            Offset em horas
        """
        # Implementação simplificada - real seria consultando preferences
        client_tz = get_timezone('America/Sao_Paulo')
        offset = client_tz.utcoffset(scheduled_at)
        return offset.total_seconds() // 3600 if offset else 0
    
    async def generate_notification_preview(
        self,
        shop_id: str,
        client_id: str,
        notification_type: NotificationType,
        client_data: Optional[Dict[str, Any]] = None
    ) -> NotificationPreview:
        """
        Gera preview de notificação com base nas preferências do cliente.
        
        Args:
            shop_id: ID da barbearia
            client_id: ID do cliente
            notification_type: Tipo de notificação
            client_data: Dados adicionais do cliente
            
        Returns:
            Preview da notificação
        """
        # Obtém preferências
        pref = await self.repo.get_effective_preferences(shop_id, client_id, notification_type)
        channel = ChannelType(pref.get('channel', ChannelType.WHATSAPP.value))
        
        # Simula dados para preview
        mock_appointment = {
            'client_name': client_data.get('name', 'João Silva') if client_data else 'João Silva',
            'barber_name': 'Carlos Barbearia',
            'service': 'Corte de Cabelo',
            'scheduled_at': datetime.now() + timedelta(hours=24),
            'price': 'R$ 35,00'
        }
        
        # Gera mensagem baseada no tipo e canal
        title, message = self._generate_message(notification_type, channel, mock_appointment)
        
        return NotificationPreview(
            notification_type=notification_type,
            channel=channel,
            title=title,
            message=message,
            variables=mock_appointment
        )
    
    def _generate_message(
        self,
        notification_type: NotificationType,
        channel: ChannelType,
        data: Dict[str, Any]
    ) -> tuple[str, str]:
        """Gera título e mensagem para preview"""
        
        templates = {
            NotificationType.BOOKING_CONFIRMATION: {
                'title': '✅ Agendamento Confirmado',
                'whatsapp': (
                    "Olá {client_name}! 🎉\n\n"
                    "Seu agendamento foi confirmado:\n"
                    "📅 {date} às {time}\n"
                    "💈 {barber_name}\n"
                    "✂️ {service}\n\n"
                    "Te esperamos! 👋"
                ),
                'email': (
                    "Seu agendamento foi confirmado com sucesso!\n\n"
                    "Detalhes:\n"
                    "- Cliente: {client_name}\n"
                    "- Data: {date}\n"
                    "- Horário: {time}\n"
                    "- Barbearia: {barber_name}\n"
                    "- Serviço: {service}\n\n"
                    "Atenciosamente,\n{barber_name}"
                )
            },
            NotificationType.REMINDER_24H: {
                'title': '📅 Lembrete: Agendamento Amanhã',
                'whatsapp': (
                    "Olá {client_name}! 👋\n\n"
                    "Lembrete do seu agendamento amanhã:\n"
                    "📅 {date}\n"
                    "⏰ {time}\n"
                    "💈 {barber_name}\n"
                    "✂️ {service}\n\n"
                    "Não esqueça! 😊"
                ),
                'email': (
                    "Lembrete: Agendamento em 24 horas\n\n"
                    "Olá {client_name},\n\n"
                    "Gostaríamos de te lembrar do seu agendamento amanhã:\n"
                    "- Data: {date}\n"
                    "- Horário: {time}\n"
                    "- Barbearia: {barber_name}\n"
                    "- Serviço: {service}\n\n"
                    "Até lá!"
                )
            },
            NotificationType.REMINDER_2H: {
                'title': '⏰ Seu agendamento começa em 2 horas',
                'whatsapp': (
                    "Olá {client_name}! ⏰\n\n"
                    "Seu horário está chegando!\n"
                    "📅 {date}\n"
                    "⏰ {time}\n"
                    "💈 {barber_name}\n"
                    "✂️ {service}\n\n"
                    "Chegue com 15 minutos de antecedência! 🚶"
                ),
                'email': (
                    "Seu agendamento começa em 2 horas\n\n"
                    "Olá {client_name},\n\n"
                    "Lembrete: Seu agendamento é em 2 horas.\n\n"
                    "Detalhes:\n"
                    "- Data: {date}\n"
                    "- Horário: {time}\n"
                    "- Barbearia: {barber_name}\n"
                    "- Serviço: {service}\n\n"
                    "Até logo!"
                )
            },
            NotificationType.CANCELLATION: {
                'title': '❌ Agendamento Cancelado',
                'whatsapp': (
                    "Olá {client_name}!\n\n"
                    "Seu agendamento foi cancelado:\n"
                    "📅 {date}\n"
                    "⏰ {time}\n"
                    "💈 {barber_name}\n"
                    "✂️ {service}\n\n"
                    "Entre em contato para reagendar! 📞"
                ),
                'email': (
                    "Agendamento Cancelado\n\n"
                    "Olá {client_name},\n\n"
                    "Informamos que seu agendamento foi cancelado:\n"
                    "- Data: {date}\n"
                    "- Horário: {time}\n"
                    "- Barbearia: {barber_name}\n"
                    "- Serviço: {service}\n\n"
                    "Entre em contato para reagendar."
                )
            },
            NotificationType.RESCHEDULE: {
                'title': '🔄 Agendamento Remarcado',
                'whatsapp': (
                    "Olá {client_name}! 🔄\n\n"
                    "Seu agendamento foi remarcado:\n"
                    "📅 {date}\n"
                    "⏰ {time}\n"
                    "💈 {barber_name}\n"
                    "✂️ {service}\n\n"
                    "Confirmado com sucesso! ✅"
                ),
                'email': (
                    "Agendamento Remarcado\n\n"
                    "Olá {client_name},\n\n"
                    "Seu agendamento foi remarcado com sucesso:\n"
                    "- Data: {date}\n"
                    "- Horário: {time}\n"
                    "- Barbearia: {barber_name}\n"
                    "- Serviço: {service}\n\n"
                    "Atenciosamente,\n{barber_name}"
                )
            },
            NotificationType.PROMOTIONAL: {
                'title': '🎁 Oferta Especial para Você!',
                'whatsapp': (
                    "Olá {client_name}! 🎁\n\n"
                    "Temos uma oferta especial:\n"
                    "✂️ {service}\n"
                    "💰 De {price} por R$ 25,00!\n\n"
                    "Agende agora! 📱"
                ),
                'email': (
                    "Oferta Especial Sua Barbearia\n\n"
                    "Olá {client_name},\n\n"
                    "Temos uma oferta especial para você:\n\n"
                    "Serviço: {service}\n"
                    "De: {price}\n"
                    "Por: R$ 25,00\n\n"
                    "Oferta válida por tempo limitado!"
                )
            },
            NotificationType.MONTHLY_REPORT: {
                'title': '📊 Relatório Mensal -{barber_name}',
                'whatsapp': (
                    "Olá {client_name}! 📊\n\n"
                    "Seu relatório mensal:\n\n"
                    "📅 Agendamentos: 3\n"
                    "💰 Total gasto: R$ 105,00\n"
                    "⭐ Satisfação: 5 estrelas\n\n"
                    "Obrigado pela preferência! 💜"
                ),
                'email': (
                    "Relatório Mensal - {barber_name}\n\n"
                    "Olá {client_name},\n\n"
                    "Aqui está seu resumo do mês:\n\n"
                    "• Agendamentos: 3\n"
                    "• Total gasto: R$ 105,00\n"
                    "• Media por visita: R$ 35,00\n"
                    "• Satisfação: 5 estrelas\n\n"
                    "Obrigado por fazer parte de nossa clientes!",
                    barber_name=data.get('barber_name', 'Barbearia')
                )
            }
        }
        
        template = templates.get(notification_type, {}).get(channel.value, templates.get(notification_type, {}).get('whatsapp', ''))
        
        # Formata data e hora
        scheduled = data.get('scheduled_at', datetime.now())
        date_str = scheduled.strftime('%d/%m/%Y')
        time_str = scheduled.strftime('%H:%M')
        
        # Substitui variáveis
        message = template.format(
            client_name=data.get('client_name', 'Cliente'),
            date=date_str,
            time=time_str,
            barber_name=data.get('barber_name', 'Barbearia'),
            service=data.get('service', 'Serviço'),
            price=data.get('price', 'R$ 0,00')
        )
        
        return template['title'], message

# ==================== Router ====================

router = APIRouter(prefix="/api/preferences", tags=["notification_preferences"])

# ==================== Endpoints ====================

@router.get("/{client_id}")
async def get_client_preferences(
    client_id: str,
    shop_id: str = Query(..., description="Shop ID")
) -> ClientPreferencesResponse:
    """
    Obtém todas as preferências de notificação de um cliente.
    """
    db = await get_db_connection()
    try:
        repo = NotificationPreferencesRepository(db)
        service = NotificationPreferencesService(db, RedisConfig())
        
        preferences = await repo.get_client_preferences(shop_id, client_id)
        shop_defaults = await repo.get_shop_defaults(shop_id)
        
        # Obtém dados do cliente
        client_query = "SELECT name, email, phone_number FROM clients WHERE id = $1"
        client = await db.fetchrow(client_query, client_id)
        
        return ClientPreferencesResponse(
            shop_id=shop_id,
            client_id=client_id,
            preferences=[NotificationPreference(**pref) for pref in preferences],
            shop_defaults=shop_defaults,
            created_at=preferences[0]['created_at'] if preferences else datetime.now(),
            updated_at=preferences[0]['updated_at'] if preferences else datetime.now()
        )
    finally:
        await db.close()

@router.put("/{client_id}")
async def update_client_preferences(
    client_id: str,
    preferences: List[NotificationPreferenceUpdate],
    shop_id: str = Query(..., description="Shop ID")
) -> List[NotificationPreference]:
    """
    Atualiza preferências de notificação de um cliente.
    """
    db = await get_db_connection()
    try:
        repo = NotificationPreferencesRepository(db)
        
        # Converte para Create models
        create_prefs = [
            NotificationPreferenceCreate(**pref.dict())
            for pref in preferences
        ]
        
        results = await repo.upsert_many_preferences(shop_id, client_id, create_prefs)
        
        return [NotificationPreference(**result) for result in results]
    finally:
        await db.close()

@router.post("/default")
async def set_shop_defaults(
    shop_id: str = Query(..., description="Shop ID"),
    defaults: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Define configurações padrão da barbearia.
    """
    db = await get_db_connection()
    try:
        query = """
        INSERT INTO shop_notification_defaults (shop_id)
        VALUES ($1)
        ON CONFLICT (shop_id) DO NOTHING
        """
        await db.execute(query, shop_id)
        
        if defaults:
            # Constrói query de atualização dinamicamente
            set_clause = []
            params = [shop_id]
            param_idx = 2
            
            for key, value in defaults.items():
                set_clause.append(f"{key} = ${param_idx}")
                params.append(value)
                param_idx += 1
            
            if set_clause:
                query = f"""
                UPDATE shop_notification_defaults
                SET {', '.join(set_clause)}, updated_at = NOW()
                WHERE shop_id = $1
                """
                await db.execute(query, *params)
        
        # Retorna atualizado
        query = "SELECT * FROM shop_notification_defaults WHERE shop_id = $1"
        row = await db.fetchrow(query, shop_id)
        
        return dict(row) if row else {}
    finally:
        await db.close()

@router.get("/{client_id}/preview/{notification_type}")
async def get_notification_preview(
    client_id: str,
    notification_type: NotificationType,
    shop_id: str = Query(..., description="Shop ID")
) -> NotificationPreview:
    """
    Gera preview de notificação para um cliente.
    """
    db = await get_db_connection()
    try:
        redis = RedisConfig()
        service = NotificationPreferencesService(db, redis)
        
        # Obtém dados do cliente
        client_query = "SELECT name, email, phone_number FROM clients WHERE id = $1"
        client = await db.fetchrow(client_query, client_id)
        client_data = dict(client) if client else None
        
        preview = await service.generate_notification_preview(
            shop_id,
            client_id,
            notification_type,
            client_data
        )
        
        return preview
    finally:
        await db.close()

@router.post("/queue")
async def queue_notification_with_preferences(
    request: QueueNotificationRequest,
    background_tasks: BackgroundTasks,
    shop_id: str = Query(..., description="Shop ID")
) -> Dict[str, Any]:
    """
    Enfileira notificação respeitando preferências do cliente.
    """
    db = await get_db_connection()
    try:
        redis = RedisConfig()
        service = NotificationPreferencesService(db, redis)
        
        # Obtém dados do agendamento
        appointment_query = """
        SELECT a.*, c.name as client_name, e.name as barber_name, s.name as service_name
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN employees e ON a.employee_id = e.id
        JOIN services s ON a.service_id = s.id
        WHERE a.id = $1
        """
        appointment = await db.fetchrow(appointment_query, request.appointment_id)
        
        if not appointment:
            raise NotFoundError("Appointment not found")
        
        appointment_data = dict(appointment)
        
        # Determina canal com base nas preferências
        scheduled_at = request.scheduled_at or datetime.now()
        channel = await service.get_notification_channel(
            shop_id,
            appointment_data['client_id'],
            request.notification_type,
            scheduled_at
        )
        
        if not channel or channel == ChannelType.NONE:
            return {"status": "skipped", "reason": "disabled_or_silent_period"}
        
        # Gera mensagem
        preview = await service.generate_notification_preview(
            shop_id,
            appointment_data['client_id'],
            request.notification_type,
            appointment_data
        )
        
        # Enfileira notificação
        # TODO: Integrar com BullMQ/Redis Queue
        # Por agora, insere na tabela notification_queue
        queue_query = """
        INSERT INTO notification_queue (
            shop_id,
            client_id,
            notification_type,
            channel,
            title,
            message,
            metadata,
            scheduled_at,
            appointment_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        """
        
        queue_id = await db.fetchval(
            queue_query,
            shop_id,
            appointment_data['client_id'],
            request.notification_type.value,
            channel.value,
            preview.title,
            preview.message,
            request.metadata,
            scheduled_at,
            request.appointment_id
        )
        
        return {
            "status": "queued",
            "queue_id": str(queue_id),
            "channel": channel.value,
            "scheduled_at": scheduled_at.isoformat()
        }
    finally:
        await db.close()

# ==================== Helper Functions ====================

def get_notification_channel_sync(
    shop_id: str,
    client_id: str,
    notification_type: str,
    scheduled_at: datetime
) -> Optional[ChannelType]:
    """
    Versão síncrona para uso em outros módulos.
    
    ATENÇÃO: Esta função deve ser refatorada para ser async
    ou chamada dentro de um contexto async apropriado.
    """
    # Placeholder para implementação síncrona
    # Na prática, deveria usar o async service
    return ChannelType.WHATSAPP

def is_silent_period_sync(
    do_not_disturb_start: Optional[str],
    do_not_disturb_end: Optional[str],
    scheduled_at: datetime,
    timezone_str: str = 'America/Sao_Paulo'
) -> bool:
    """
    Versão síncrona para verificar período de silêncio.
    """
    if not do_not_disturb_start or not do_not_disturb_end:
        return False
    
    try:
        client_tz = get_timezone(timezone_str)
        scheduled_local = scheduled_at.astimezone(client_tz)
        scheduled_time = scheduled_local.time()
        
        start = datetime.strptime(do_not_disturb_start, '%H:%M').time()
        end = datetime.strptime(do_not_disturb_end, '%H:%M').time()
        
        if start <= end:
            return start <= scheduled_time <= end
        else:
            return scheduled_time >= start or scheduled_time <= end
    except (ValueError, AttributeError):
        return False

# ==================== Exports ====================

__all__ = [
    'router',
    'NotificationPreferencesService',
    'NotificationPreferencesRepository',
    'get_client_preferences',
    'update_client_preferences',
    'set_shop_defaults',
    'get_notification_preview',
    'queue_notification_with_preferences',
    'get_notification_channel_sync',
    'is_silent_period_sync',
]
