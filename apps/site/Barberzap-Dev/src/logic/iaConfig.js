/**
 * AI Secretary Configuration Logic
 */

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
  tone: 'casual',
  toneConfig: {
    greeting: 'Olá! Bem-vindo! Como posso ajudar?',
    scheduling: 'Perfeito! Vamos agendar seu horário. Que dia você prefere?',
    pricing: 'Nossos preços variam conforme o serviço. Quer saber mais?',
    location: 'Estamos localizados em {address}. Ficaremos felizes em receber você!',
    noShow: 'Oh, parece que você perdeu seu horário. Quer reagendar?',
  },
  fallbackText: 'Desculpe, não entendi muito bem. Poderia reformular sua pergunta? Ou se preferir, posso transferir para um atendente humano.',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: `Você é Ana, a assistente virtual da barbearia. Seja sempre:\n\n1. Simpática e profissional\n2. Útil e direta nas respostas\n3. Específica sobre serviços e preços\n4. Acolhedora e atenciosa\n\nSua função é:\n- Agendar horários de clientes\n- Fornecer informações sobre serviços e preços\n- Responder dúvidas comuns\n- Direcionar para atendimento humano quando necessário\n\nTome: {tone}\nServiços: {services}\nHorários: {businessHours}`,
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

export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Profissional e educado' },
  { value: 'casual', label: 'Casual', description: 'Descontraído e amigável' },
  { value: 'friendly', label: 'Amigável', description: 'Caloroso e acessível' },
  { value: 'custom', label: 'Personalizado', description: 'Definido pelo usuário' },
];

export const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Modelo mais avançado' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Rápido e econômico' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Balanceado' },
];

const STORAGE_KEY = 'barberzap_ia_config';

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

export const saveIAConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving IA config:', error);
    return false;
  }
};

export const resetIAConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULT_IA_CONFIG };
};

export const toggleSpecialistAgent = (agentKey, config) => {
  const updated = {
    ...config,
    specialistAgents: {
      ...config.specialistAgents,
      [agentKey]: {
        ...config.specialistAgents[agentKey],
        enabled: !config.specialistAgents[agentKey]?.enabled,
      },
    },
  };
  saveIAConfig(updated);
  return updated;
};

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
