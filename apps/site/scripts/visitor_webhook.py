from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
import os
import logging
from supabase import create_client, Client
import ipaddress

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Visitor Tracking Webhook", version="1.0.0")

# Configurações
WEBHOOK_AUTH_TOKEN = os.getenv("WEBHOOK_AUTH_TOKEN", "seu-token-secreto-aqui")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://seu-projeto.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sua-chave-anon")

# Inicializa cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Modelos Pydantic
class LocationData(BaseModel):
    country: str
    countryCode: str
    region: str
    city: str

class VisitorEvent(BaseModel):
    visitorId: str
    sessionId: str
    isNewVisitor: bool
    isNewSession: bool
    timestamp: str
    date: str
    entryTime: int
    sessionDuration: int
    pageViews: int
    currentUrl: str
    referrer: str
    ip: str
    location: LocationData
    browser: str
    browserVersion: str
    userAgent: str
    device: str
    operatingSystem: str
    screenResolution: str
    language: str
    timezone: str
    javaEnabled: bool
    cookiesEnabled: bool
    onlineStatus: bool
    
    @validator('ip')
    def validate_ip(cls, v):
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            return '0.0.0.0'

class EventData(BaseModel):
    type: str
    data: VisitorEvent
    timestamp: int

class WebhookPayload(BaseModel):
    events: List[EventData]

# Dependências de autenticação
async def verify_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    scheme, token = authorization.split(' ', 1) if ' ' in authorization else ('', authorization)
    
    if scheme.lower() != 'bearer' or token != WEBHOOK_AUTH_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    return token

# Funções auxiliares
def validate_url(url: str) -> str:
    """Valida e sanitiza URL"""
    if not url or len(url) > 2048:
        return 'unknown'
    return url[:2048]

def sanitize_user_agent(user_agent: str) -> str:
    """Sanitiza user agent"""
    if not user_agent or len(user_agent) > 1000:
        return 'unknown'
    return user_agent[:1000]

def get_country_code(country: str) -> str:
    """Obtém código do país (simplificado)"""
    # Mapeamento básico de países comuns
    country_codes = {
        'brazil': 'BR',
        'united states': 'US',
        'canada': 'CA',
        'mexico': 'MX',
        'argentina': 'AR',
        'chile': 'CL',
        'colombia': 'CO',
        'peru': 'PE',
        'venezuela': 'VE',
        'ecuador': 'EC',
        'bolivia': 'BO',
        'paraguay': 'PY',
        'uruguay': 'UY',
        'guyana': 'GY',
        'suriname': 'SR',
        'france': 'FR',
        'germany': 'DE',
        'spain': 'ES',
        'italy': 'IT',
        'portugal': 'PT',
        'united kingdom': 'GB',
        'unknown': 'XX'
    }
    
    country_lower = country.lower()
    return country_codes.get(country_lower, 'XX')

# Rotas da API
@app.post("/api/visitor-webhook")
async def receive_visitor_data(
    payload: WebhookPayload,
    token: str = Depends(verify_token),
    x_session_id: Optional[str] = Header(None)
):
    """
    Recebe dados de visitantes do script JavaScript
    """
    try:
        logger.info(f"Recebendo {len(payload.events)} eventos de tracking")
        
        results = []
        
        for event in payload.events:
            try:
                # Valida e sanitiza dados
                event_data = event.data
                
                # Sanitiza URLs
                event_data.currentUrl = validate_url(event_data.currentUrl)
                event_data.referrer = validate_url(event_data.referrer)
                
                # Sanitiza user agent
                event_data.userAgent = sanitize_user_agent(event_data.userAgent)
                
                # Normaliza código do país
                event_data.location.countryCode = get_country_code(event_data.location.country)
                
                # Prepara dados para inserção
                visitor_record = {
                    'visitor_id': event_data.visitorId,
                    'session_id': event_data.sessionId,
                    'is_new_visitor': event_data.isNewVisitor,
                    'is_new_session': event_data.isNewSession,
                    'event_type': event.type,
                    'timestamp': event_data.timestamp,
                    'entry_time': datetime.fromtimestamp(event_data.entryTime / 1000),
                    'session_duration': event_data.sessionDuration,
                    'page_views': event_data.pageViews,
                    'current_url': event_data.currentUrl,
                    'referrer': event_data.referrer,
                    'ip_address': event_data.ip,
                    'country': event_data.location.country,
                    'country_code': event_data.location.countryCode,
                    'region': event_data.location.region,
                    'city': event_data.location.city,
                    'browser': event_data.browser,
                    'browser_version': event_data.browserVersion,
                    'user_agent': event_data.userAgent,
                    'device': event_data.device,
                    'operating_system': event_data.operatingSystem,
                    'screen_resolution': event_data.screenResolution,
                    'language': event_data.language,
                    'timezone': event_data.timezone,
                    'java_enabled': event_data.javaEnabled,
                    'cookies_enabled': event_data.cookiesEnabled,
                    'online_status': event_data.onlineStatus,
                    'created_at': datetime.utcnow()
                }
                
                # Insere no Supabase
                result = supabase.table('visitors').insert(visitor_record).execute()
                
                # Se for novo visitante, atualiza contador
                if event_data.isNewVisitor:
                    try:
                        # Tenta obter contador atual
                        counter_result = supabase.table('visitor_stats').select('total_visitors').eq('id', 1).execute()
                        
                        if counter_result.data:
                            # Atualiza contador existente
                            new_count = counter_result.data[0]['total_visitors'] + 1
                            supabase.table('visitor_stats').update({'total_visitors': new_count}).eq('id', 1).execute()
                        else:
                            # Cria contador inicial
                            supabase.table('visitor_stats').insert({'total_visitors': 1, 'id': 1}).execute()
                    except Exception as e:
                        logger.warning(f"Erro ao atualizar contador de visitantes: {e}")
                
                results.append({
                    'event_id': event.timestamp,
                    'status': 'success',
                    'visitor_id': event_data.visitorId
                })
                
                logger.info(f"Evento processado: {event.type} - Visitor: {event_data.visitorId}")
                
            except Exception as e:
                logger.error(f"Erro ao processar evento {event.timestamp}: {e}")
                results.append({
                    'event_id': event.timestamp,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Retorna resumo do processamento
        success_count = sum(1 for r in results if r['status'] == 'success')
        error_count = sum(1 for r in results if r['status'] == 'error')
        
        logger.info(f"Processamento concluído: {success_count} sucessos, {error_count} erros")
        
        return {
            'status': 'processed',
            'total_events': len(payload.events),
            'successful': success_count,
            'errors': error_count,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Erro geral no webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/visitor-stats")
async def get_visitor_stats(token: str = Depends(verify_token)):
    """
    Retorna estatísticas básicas de visitantes
    """
    try:
        # Total de visitantes únicos
        total_visitors_result = supabase.table('visitor_stats').select('total_visitors').eq('id', 1).execute()
        total_visitors = total_visitors_result.data[0]['total_visitors'] if total_visitors_result.data else 0
        
        # Visitantes hoje
        today = datetime.utcnow().date()
        today_visitors_result = supabase.table('visitors').select('visitor_id', count='exact').gte('created_at', today).execute()
        today_visitors = today_visitors_result.count if hasattr(today_visitors_result, 'count') else 0
        
        # Sessões hoje
        today_sessions_result = supabase.table('visitors').select('session_id', count='exact').gte('created_at', today).execute()
        today_sessions = today_sessions_result.count if hasattr(today_sessions_result, 'count') else 0
        
        # Dispositivos mais comuns
        devices_result = supabase.table('visitors').select('device', count='exact').gte('created_at', today).group('device').execute()
        
        return {
            'total_visitors': total_visitors,
            'today_visitors': today_visitors,
            'today_sessions': today_sessions,
            'devices': devices_result.data if devices_result.data else []
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@app.get("/api/visitor-recent")
async def get_recent_visitors(limit: int = 10, token: str = Depends(verify_token)):
    """
    Retorna visitantes recentes
    """
    try:
        result = supabase.table('visitors').select(
            'visitor_id', 'session_id', 'country', 'city', 'browser', 'device',
            'current_url', 'created_at'
        ).order('created_at', desc=True).limit(limit).execute()
        
        return {
            'visitors': result.data if result.data else []
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter visitantes recentes: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching recent visitors: {str(e)}")

@app.get("/api/health")
async def health_check():
    """
    Health check do serviço
    """
    try:
        # Testa conexão com Supabase
        test_result = supabase.table('visitors').select('id').limit(1).execute()
        
        return {
            'status': 'healthy',
            'service': 'visitor-tracking-webhook',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected'
        }
        
    except Exception as e:
        logger.error(f"Health check falhou: {e}")
        return {
            'status': 'unhealthy',
            'service': 'visitor-tracking-webhook',
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'disconnected',
            'error': str(e)
        }

# Middleware para logging
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s"
    )
    
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)