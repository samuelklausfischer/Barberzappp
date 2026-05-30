/**
 * BarberZap - AI Secretary Configuration Logic
 * 
 * Manages IA secretary settings, specialist agents, and knowledge base.
 */

// Default configuration
export const DEFAULT_IA_CONFIG = {
  secretaryName: 'Ana',
  avatar: '',
  welcomeMessage: 'Olá! Bem-vindo à Barbearia. Sou Ana, sua assistente virtual. Como posso ajudar você hoje?',
  businessHours: {
    open: '09:00',
    close: '18:00',
    timezone: 'America/Sao_Paulo',
  },
  businessLocation: {
    address: 'Rua Principal, 123',
    city: 'São Paulo',
    state: 'SP',
    phone: '(11) 99999-9999',
  },
  tone: 'casual', // 'formal' | 'casual' | 'friendly' | 'custom'
  toneConfig: {
    greeting: 'Olá! Bem-vindo! Como posso ajudar?',
    scheduling: 'Perfeito! Vamos agendar seu horário. Que dia você prefere?',
    pricing: 'Nossos preços variam conforme o serviço. Quer saber mais?',
    location: 'Estamos localizados em {address}. Ficarei felizes em receber você!',
    noShow: 'Oh, parece que você perdeu seu horário. Quer reagendar?',
  },
  fallbackText: 'Desculpe, não entendi muito bem. Poderia reformular sua pergunta? Ou se preferir, posso transferir para um atendente humano.',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `Você é Ana, a assistente virtual da barbearia. Seja sempre:

1. Simpática e profissional
2. Útil e direta nas respostas
3. Específica sobre serviços e preços
4. Acolhedora e atenciosa

Sua função é:
- Agendar horários de clientes
- Fornecer informações sobre serviços e preços
- Responder dúvidas comuns
- Direcionar para atendimento humano quando necessário

Tome: {tone}
Serviços: {services}
Horários: {businessHours}`,
  specialistAgents: {
    greetings: {
      enabled: true,
      label: 'Saudação',
      description: 'Gerencia boas-vindas e apresentações',
      icon: '👋',
    },
    scheduling: {
      enabled: true,
      label: 'Agendamento',
      description: 'Lida com marcações de horário',
      icon: '📅',
    },
    qa: {
      enabled: true,
      label: 'Dúvidas',
      description: 'Responde perguntas frequentes',
      icon: '❓',
    },
    location: {
      enabled: true,
      label: 'Localização',
      description: 'Fornece endereço e direções',
      icon: '📍',
    },
    personalCompany: {
      enabled: true,
      label: 'Pessoal/Empresa',
      description: 'Distingue cliente de parceiro',
      icon: '🏢',
    },
    services: {
      enabled: true,
      label: 'Serviços',
      description: 'Detalha catálogo de serviços',
      icon: '💈',
    },
  },
  knowledgeBase: {
    services: [],
    pricing: {},
    hours: {},
    faqCustom: '',
  },
  analytics: {
    messagesHandled: 1250,
    successRate: 94.5,
    escalatesToHuman: 69,
    avgResponseTime: 2.3,
  },
};

// Storage key
const STORAGE_KEY = 'barberzap_ia_config';

// Tone options
export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Profissional e educado' },
  { value: 'casual', label: 'Casual', description: 'Descontraído e amigável' },
  { value: 'friendly', label: 'Amigável', description: 'Caloroso e acessível' },
  { value: 'custom', label: 'Personalizado', description: 'Definido pelo usuário' },
];

// Model options
export const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Modelo mais avançado' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Rápido e econômico' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Balanceado' },
];

/**
 * Get current IA configuration
 */
export const getIAConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_IA_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error loading IA config:', error);
  }
  return { ...DEFAULT_IA_CONFIG };
};

/**
 * Save IA configuration
 */
export const saveIAConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving IA config:', error);
    return false;
  }
};

/**
 * Reset IA configuration to defaults
 */
export const resetIAConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_IA_CONFIG };
};

/**
 * Update a specific section of the config
 */
export const updateIAConfigSection = (section, data) => {
  const current = getIAConfig();
  const updated = {
    ...current,
    [section]: { ...current[section], ...data },
  };
  saveIAConfig(updated);
  return updated;
};

/**
 * Toggle specialist agent
 */
export const toggleSpecialistAgent = (agentKey) => {
  const current = getIAConfig();
  const updated = {
    ...current,
    specialistAgents: {
      ...current.specialistAgents,
      [agentKey]: {
        ...current.specialistAgents[agentKey],
        enabled: !current.specialistAgents[agentKey]?.enabled,
      },
    },
  };
  saveIAConfig(updated);
  return updated;
};

/**
 * Import knowledge base from other modules
 */
export const importKnowledgeBase = (services, hours, pricing) => {
  const current = getIAConfig();
  const updated = {
    ...current,
    knowledgeBase: {
      ...current.knowledgeBase,
      services: services || [],
      hours: hours || {},
      pricing: pricing || {},
    },
  };
  saveIAConfig(updated);
  return updated;
};

/**
 * Generate system prompt from config
 */
export const generateSystemPrompt = (config) => {
  const toneText = {
    formal: 'Formal e profissional',
    casual: 'Casual e descontraído',
    friendly: 'Amigável e caloroso',
    custom: 'Personalizado',
  }[config.tone] || config.tone;

  const servicesText = config.knowledgeBase?.services
    ?.map(s => `${s.name} - R$ ${s.price}`)
    ?.join(', ') || 'Serviços variados';

  const hoursText = `Horário de funcionamento: ${config.businessHours?.open || '09:00'} às ${config.businessHours?.close || '18:00'}`;

  let prompt = config.systemPrompt || DEFAULT_IA_CONFIG.systemPrompt;

  // Replace variables
  prompt = prompt.replace('{tone}', toneText);
  prompt = prompt.replace('{services}', servicesText);
  prompt = prompt.replace('{businessHours}', hoursText);
  prompt = prompt.replace('{secretaryName}', config.secretaryName || 'Ana');

  return prompt;
};

/**
 * Validate IA configuration
 */
export const validateIAConfig = (config) => {
  const errors = [];

  if (!config.secretaryName?.trim()) {
    errors.push('Nome da secretária é obrigatório');
  }

  if (!config.welcomeMessage?.trim()) {
    errors.push('Mensagem de boas-vindas é obrigatória');
  }

  if (!config.model) {
    errors.push('Selecione um modelo de IA');
  }

  if (config.temperature < 0 || config.temperature > 2) {
    errors.push('Temperatura deve estar entre 0 e 2');
  }

  if (config.maxTokens < 1 || config.maxTokens > 128000) {
    errors.push('Máximo de tokens inválido');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Mock analytics data for demo
 */
export const getAnalyticsData = () => {
  const config = getIAConfig();
  return config.analytics || DEFAULT_IA_CONFIG.analytics;
};

/**
 * Simulate AI response (for preview)
 */
export const simulateAIResponse = (message, config) => {
  const response = {
    timestamp: new Date(),
    agentUsed: null,
    confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
    message: '',
  };

  const lowerMsg = message.toLowerCase();

  // Determine which specialist should handle
  if (['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'eae'].some(g => lowerMsg.includes(g))) {
    response.agentUsed = 'greetings';
    response.message = config.toneConfig?.greeting || config.welcomeMessage;
  } else if (['agendar', 'marcar', 'horário', 'hora', 'dia'].some(s => lowerMsg.includes(s))) {
    response.agentUsed = 'scheduling';
    response.message = config.toneConfig?.scheduling || 'Vou verificar os horários disponíveis...';
  } else if (['preço', 'valor', 'quanto', 'custa'].some(p => lowerMsg.includes(p))) {
    response.agentUsed = 'services';
    const services = config.knowledgeBase?.services || [];
    const serviceList = services.slice(0, 3).map(s => `${s.name}: R$${s.price}`).join(', ');
    response.message = serviceList
      ? `Nossos serviços: ${serviceList}. Quer agendar algum?`
      : 'Posso informar sobre preços! Qual serviço você quer saber?';
  } else if (['endreço', 'onde', 'local', 'fica', 'chegar'].some(l => lowerMsg.includes(l))) {
    response.agentUsed = 'location';
    response.message = config.toneConfig?.location?.replace('{address}', config.businessLocation?.address || 'Rua Principal, 123');
  } else {
    response.message = config.fallbackText || 'Não entendi. Pode repetir?';
  }

  return response;
};

// Export all
export default {
  DEFAULT_IA_CONFIG,
  TONE_OPTIONS,
  MODEL_OPTIONS,
  getIAConfig,
  saveIAConfig,
  resetIAConfig,
  updateIAConfigSection,
  toggleSpecialistAgent,
  importKnowledgeBase,
  generateSystemPrompt,
  validateIAConfig,
  getAnalyticsData,
  simulateAIResponse,
};
