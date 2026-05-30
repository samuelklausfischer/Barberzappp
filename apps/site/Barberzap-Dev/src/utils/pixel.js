export const PIXEL_ID = '1757123869009394';

// Utilitário seguro para disparar eventos
export const trackEvent = (name, data = {}) => {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', name, data);
    }
  } catch (error) {
    console.error('Erro silencioso no Pixel:', error);
  }
};

// Eventos Padrão Predefinidos
export const pixelEvents = {
  pageView: () => trackEvent('PageView'),
  viewContent: (contentName) => trackEvent('ViewContent', { content_name: contentName }),
  initiateCheckout: (value, currency = 'BRL') => trackEvent('InitiateCheckout', { value, currency }),
  contact: (method = 'whatsapp') => trackEvent('Contact', { content_name: method }),
  viewPrice: () => trackEvent('ViewPrice'), // Evento Personalizado: Viu a oferta
  lead: () => trackEvent('Lead')
};
