/**
 * Visitor Tracker - Sistema de análise de visitantes simplificado
 * Script não-intrusivo para coleta de dados de visitantes
 */

(function() {
    'use strict';
    
    // Configurações
    const CONFIG = {
        WEBHOOK_URL: 'https://seu-dominio.com/api/visitor-webhook',
        WEBHOOK_AUTH_TOKEN: 'seu-token-secreto-aqui',
        BATCH_SIZE: 1,
        SEND_INTERVAL: 3000,
        RETRY_ATTEMPTS: 3,
        SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutos
    };
    
    // Estado da sessão
    let sessionData = {
        sessionId: generateSessionId(),
        startTime: Date.now(),
        lastActivity: Date.now(),
        pageViews: 0,
        isNewSession: true
    };
    
    // Buffer de eventos
    let eventBuffer = [];
    let isSending = false;
    
    /**
     * Gera ID único da sessão
     */
    function generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Gera ID único do visitante
     */
    function generateVisitorId() {
        let visitorId = localStorage.getItem('vt_visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('vt_visitor_id', visitorId);
        }
        return visitorId;
    }
    
    /**
     * Detecta se é um novo visitante
     */
    function isNewVisitor() {
        return !localStorage.getItem('vt_visitor_id');
    }
    
    /**
     * Obtém informações do navegador
     */
    function getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let version = 'Unknown';
        
        // Detecta navegador
        if (ua.indexOf('Chrome') > -1) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Firefox') > -1) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Safari') > -1) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Edge') > -1) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+\.\d+)/)?.[1] || 'Unknown';
        }
        
        return { browser, version, userAgent: ua };
    }
    
    /**
     * Obtém informações do dispositivo
     */
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Desktop';
        let os = 'Unknown';
        
        // Detecta sistema operacional
        if (ua.indexOf('Windows NT') > -1) {
            os = 'Windows';
        } else if (ua.indexOf('Mac OS X') > -1) {
            os = 'macOS';
        } else if (ua.indexOf('Linux') > -1) {
            os = 'Linux';
        } else if (ua.indexOf('Android') > -1) {
            os = 'Android';
            device = 'Mobile';
        } else if (ua.indexOf('iPhone') > -1) {
            os = 'iOS';
            device = 'Mobile';
        } else if (ua.indexOf('iPad') > -1) {
            os = 'iOS';
            device = 'Tablet';
        }
        
        // Detecta tipo de dispositivo
        if (window.innerWidth <= 768) {
            device = 'Mobile';
        } else if (window.innerWidth <= 1024) {
            device = 'Tablet';
        }
        
        return { device, os, screenResolution: `${screen.width}x${screen.height}` };
    }
    
    /**
     * Obtém localização aproximada via IP (usando API pública)
     */
    async function getLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return {
                country: data.country_name || 'Unknown',
                countryCode: data.country_code || 'Unknown',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                ip: data.ip || 'Unknown'
            };
        } catch (error) {
            console.warn('VisitorTracker: Falha ao obter localização', error);
            return {
                country: 'Unknown',
                countryCode: 'Unknown',
                region: 'Unknown',
                city: 'Unknown',
                ip: 'Unknown'
            };
        }
    }
    
    /**
     * Coleta dados do visitante
     */
    async function collectVisitorData() {
        const browserInfo = getBrowserInfo();
        const deviceInfo = getDeviceInfo();
        const location = await getLocation();
        
        return {
            visitorId: generateVisitorId(),
            sessionId: sessionData.sessionId,
            isNewVisitor: isNewVisitor(),
            isNewSession: sessionData.isNewSession,
            
            // Dados de acesso
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('pt-BR'),
            entryTime: sessionData.startTime,
            sessionDuration: Date.now() - sessionData.startTime,
            pageViews: sessionData.pageViews,
            currentUrl: window.location.href,
            referrer: document.referrer || 'Direct',
            
            // Informações técnicas
            ip: location.ip,
            location: {
                country: location.country,
                countryCode: location.countryCode,
                region: location.region,
                city: location.city
            },
            browser: browserInfo.browser,
            browserVersion: browserInfo.version,
            userAgent: browserInfo.userAgent,
            device: deviceInfo.device,
            operatingSystem: deviceInfo.os,
            screenResolution: deviceInfo.screenResolution,
            language: navigator.language || 'Unknown',
            
            // Dados adicionais
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            javaEnabled: navigator.javaEnabled(),
            cookiesEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine
        };
    }
    
    /**
     * Envia dados para o webhook
     */
    async function sendToWebhook(data) {
        if (isSending) return;
        
        isSending = true;
        let attempts = 0;
        
        while (attempts < CONFIG.RETRY_ATTEMPTS) {
            try {
                const response = await fetch(CONFIG.WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CONFIG.WEBHOOK_AUTH_TOKEN}`,
                        'X-Session-ID': sessionData.sessionId
                    },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('VisitorTracker: Dados enviados com sucesso', result);
                eventBuffer = []; // Limpa buffer após sucesso
                break;
                
            } catch (error) {
                attempts++;
                console.warn(`VisitorTracker: Tentativa ${attempts} falhou`, error);
                
                if (attempts >= CONFIG.RETRY_ATTEMPTS) {
                    console.error('VisitorTracker: Falha ao enviar dados após todas as tentativas');
                    // Mantém dados no buffer para tentar novamente mais tarde
                } else {
                    // Aguarda antes de tentar novamente (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                }
            }
        }
        
        isSending = false;
    }
    
    /**
     * Processa e envia eventos do buffer
     */
    async function processEventBuffer() {
        if (eventBuffer.length === 0 || isSending) return;
        
        const eventsToSend = eventBuffer.slice(0, CONFIG.BATCH_SIZE);
        await sendToWebhook({ events: eventsToSend });
    }
    
    /**
     * Registra evento de página visualizada
     */
    async function trackPageView() {
        sessionData.pageViews++;
        sessionData.lastActivity = Date.now();
        
        const visitorData = await collectVisitorData();
        
        eventBuffer.push({
            type: 'page_view',
            data: visitorData,
            timestamp: Date.now()
        });
        
        // Envia imediatamente se for novo visitante ou nova sessão
        if (visitorData.isNewVisitor || sessionData.isNewSession) {
            await processEventBuffer();
        }
        
        sessionData.isNewSession = false;
    }
    
    /**
     * Registra evento de saída da página
     */
    function trackPageExit() {
        const sessionDuration = Date.now() - sessionData.startTime;
        
        eventBuffer.push({
            type: 'page_exit',
            data: {
                sessionId: sessionData.sessionId,
                sessionDuration: sessionDuration,
                pageViews: sessionData.pageViews
            },
            timestamp: Date.now()
        });
        
        // Tenta enviar antes de sair (não garantido em todos os navegadores)
        if (navigator.sendBeacon) {
            const data = new Blob([JSON.stringify({ events: eventBuffer })], {
                type: 'application/json'
            });
            navigator.sendBeacon(CONFIG.WEBHOOK_URL, data);
        }
    }
    
    /**
     * Verifica timeout da sessão
     */
    function checkSessionTimeout() {
        const now = Date.now();
        if (now - sessionData.lastActivity > CONFIG.SESSION_TIMEOUT) {
            // Nova sessão
            sessionData = {
                sessionId: generateSessionId(),
                startTime: now,
                lastActivity: now,
                pageViews: 0,
                isNewSession: true
            };
        }
    }
    
    /**
     * Inicializa o tracker
     */
    function init() {
        console.log('VisitorTracker: Inicializando...');
        
        // Verifica se é nova sessão
        checkSessionTimeout();
        
        // Registra visualização inicial
        trackPageView();
        
        // Configura envio periódico
        setInterval(processEventBuffer, CONFIG.SEND_INTERVAL);
        
        // Event listeners
        window.addEventListener('beforeunload', trackPageExit);
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                sessionData.lastActivity = Date.now();
            }
        });
        
        // Track clicks e scrolls (opcional)
        document.addEventListener('click', (e) => {
            sessionData.lastActivity = Date.now();
        });
        
        console.log('VisitorTracker: Inicializado com sucesso');
    }
    
    // Inicializa quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // API pública para uso externo
    window.VisitorTracker = {
        trackEvent: async function(eventType, eventData) {
            eventBuffer.push({
                type: eventType,
                data: eventData,
                timestamp: Date.now()
            });
        },
        getSessionId: function() {
            return sessionData.sessionId;
        },
        getVisitorId: function() {
            return generateVisitorId();
        }
    };
    
})();