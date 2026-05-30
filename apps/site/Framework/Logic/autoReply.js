/**
 * Auto-Reply Configuration
 * 
 * Manages auto-reply rules for WhatsApp messages.
 * 
 * @module autoReply
 */

const STORAGE_KEY = 'barberzap_auto_reply_rules';

/**
 * Default auto-reply rules
 */
const DEFAULT_RULES = [
  {
    id: '1',
    name: 'Bem-vindo',
    triggerKeywords: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
    replyTemplate: 'Olá! 👋 Bem-vindo à {BARBERSHOP_NAME}. Como posso ajudá-lo hoje?\n\n📅 Para agendar um horário\n✂️ Para ver nossos serviços\n💰 Para valores\n📍 Para nosso endereço',
    enabled: true,
    useAI: false,
    category: 'greeting',
    priority: 1
  },
  {
    id: '2',
    name: 'Horários',
    triggerKeywords: ['horário', 'horario', 'abre', 'fecha', 'funciona'],
    replyTemplate: '🕐 Nossos horários de funcionamento:\n\nSegunda a Sexta: {OPEN_TIME} - {CLOSE_TIME}\nSábado: {SATURDAY_HOURS}\nDomingo: Fechado\n\nAgende pelo WhatsApp: {WHATSAPP_NUMBER}',
    enabled: true,
    useAI: false,
    category: 'hours',
    priority: 2
  },
  {
    id: '3',
    name: 'Agendamento',
    triggerKeywords: ['agendar', 'marcar', 'horário', 'agendamento', 'cortar', 'corte', 'barba'],
    replyTemplate: '✂️ Para agendar seu corte, preciso de algumas informações:\n\n1️⃣ Qual serviço você deseja?\n2️⃣ Qual dia e horário prefere?\n3️⃣ Qual barbeiro de preferência?\n\nVou verificar a disponibilidade e confirmar com você! ✅',
    enabled: true,
    useAI: true,
    category: 'booking',
    priority: 3
  },
  {
    id: '4',
    name: 'Valores',
    triggerKeywords: ['preço', 'preco', 'valor', 'quanto custa', 'preços', 'valores', 'tabela'],
    replyTemplate: '💰 Nossa tabela de preços:\n\n{SERVICES_LIST}\n\n✨ Pacotes com desconto disponíveis! Pergunte sobre eles.',
    enabled: true,
    useAI: false,
    category: 'pricing',
    priority: 4
  },
  {
    id: '5',
    name: 'Endereço',
    triggerKeywords: ['endereço', 'endereco', 'onde fica', 'localização', 'localizacao', 'como chegar', 'rua', 'avenida'],
    replyTemplate: '📍 {BARBERSHOP_NAME}\n🏠 {ADDRESS}\n\n🚗 Referência: {REFERENCE_POINT}\n\nClique aqui para abrir no Google Maps: {MAPS_URL}',
    enabled: true,
    useAI: false,
    category: 'location',
    priority: 5
  },
  {
    id: '6',
    name: 'Cancelar Agendamento',
    triggerKeywords: ['cancelar', 'desmarcar', 'não vou', 'nao vou', 'preciso cancelar'],
    replyTemplate: '📝 Para cancelar seu agendamento, por favor me informe:\n\n📱 Seu telefone de cadastro\n🗓️ Data e horário do agendamento\n\nVou processar o cancelamento o mais rápido possível. Lembre-se de cancelar com pelo menos 2h de antecedência para não gerar multa. ⏰',
    enabled: true,
    useAI: true,
    category: 'cancellation',
    priority: 6
  }
];

/**
 * Auto-Reply Service
 */
export const autoReplyService = {
  /**
   * Load all rules from localStorage
   */
  loadRules() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      // Initialize with default rules on first load
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
      return DEFAULT_RULES;
    } catch (error) {
      console.error('Error loading auto-reply rules:', error);
      return DEFAULT_RULES;
    }
  },

  /**
   * Save all rules to localStorage
   */
  saveRules(rules) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      return true;
    } catch (error) {
      console.error('Error saving auto-reply rules:', error);
      return false;
    }
  },

  /**
   * Get rule by ID
   */
  getRuleById(id) {
    const rules = this.loadRules();
    return rules.find(r => r.id === id);
  },

  /**
   * Get enabled rules only
   */
  getEnabledRules() {
    const rules = this.loadRules();
    return rules.filter(r => r.enabled);
  },

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    const rules = this.loadRules();
    return rules.filter(r => r.category === category);
  },

  /**
   * Create new rule
   */
  createRule(rule) {
    const rules = this.loadRules();
    const newRule = {
      id: Date.now().toString(),
      name: rule.name || 'Nova Regra',
      triggerKeywords: rule.triggerKeywords || [],
      replyTemplate: rule.replyTemplate || '',
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      useAI: rule.useAI || false,
      category: rule.category || 'custom',
      priority: rule.priority || 99,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedRules = [...rules, newRule];
    this.saveRules(updatedRules);
    return newRule;
  },

  /**
   * Update existing rule
   */
  updateRule(id, updates) {
    const rules = this.loadRules();
    const index = rules.findIndex(r => r.id === id);
    
    if (index === -1) {
      throw new Error('Rule not found');
    }

    const updatedRule = {
      ...rules[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    const updatedRules = [
      ...rules.slice(0, index),
      updatedRule,
      ...rules.slice(index + 1)
    ];

    this.saveRules(updatedRules);
    return updatedRule;
  },

  /**
   * Delete rule
   */
  deleteRule(id) {
    const rules = this.loadRules();
    const updatedRules = rules.filter(r => r.id !== id);
    this.saveRules(updatedRules);
    return true;
  },

  /**
   * Find matching rule for message
   */
  findMatchingRule(message) {
    const rules = this.getEnabledRules();
    const messageLower = message.toLowerCase().trim();
    
    // Sort by priority (lower number = higher priority)
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      if (rule.triggerKeywords && rule.triggerKeywords.length > 0) {
        const matches = rule.triggerKeywords.some(keyword => {
          const keywordLower = keyword.toLowerCase();
          // Check if message contains the keyword or keyword contains message
          return messageLower.includes(keywordLower) || keywordLower.includes(messageLower);
        });

        if (matches) {
          return rule;
        }
      }
    }

    return null;
  },

  /**
   * Generate reply using matched rule
   */
  generateReply(message, context = {}) {
    const rule = this.findMatchingRule(message);
    
    if (!rule) {
      return null;
    }

    let reply = rule.replyTemplate;

    // Replace common placeholders
    const placeholders = {
      '{BARBERSHOP_NAME}': context.barbershopName || 'Nossa Barbearia',
      '{PHONE}': context.phone || '(11) 98765-4321',
      '{WHATSAPP_NUMBER}': context.whatsapp || '(11) 98765-4321',
      '{OPEN_TIME}': context.openTime || '09:00',
      '{CLOSE_TIME}': context.closeTime || '20:00',
      '{SATURDAY_HOURS}': context.saturdayHours || '09:00 - 18:00',
      '{ADDRESS}': context.address || 'Rua Exemplo, 123',
      '{REFERENCE_POINT}': context.reference || 'Em frente ao mercado',
      '{MAPS_URL}': context.mapsUrl || 'https://maps.google.com',
      '{SERVICES_LIST}': context.services || 'Corte: R$ 40\nBarba: R$ 25\nCombos a partir de R$ 55'
    };

    // Replace placeholders in template
    Object.entries(placeholders).forEach(([key, value]) => {
      reply = reply.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return {
      rule,
      reply,
      useAI: rule.useAI
    };
  },

  /**
   * Toggle rule enabled state
   */
  toggleRule(id) {
    const rule = this.getRuleById(id);
    if (rule) {
      return this.updateRule(id, { enabled: !rule.enabled });
    }
    throw new Error('Rule not found');
  },

  /**
   * Duplicate rule
   */
  duplicateRule(id) {
    const rule = this.getRuleById(id);
    if (rule) {
      const newRule = {
        ...rule,
        id: undefined, // Let createRule generate new ID
        name: `${rule.name} (cópia)`,
        createdAt: undefined,
        updatedAt: undefined
      };
      return this.createRule(newRule);
    }
    throw new Error('Rule not found');
  },

  /**
   * Import rules from JSON
   */
  importRules(rulesJson) {
    try {
      const rules = JSON.parse(rulesJson);
      if (!Array.isArray(rules)) {
        throw new Error('Invalid format: expected array');
      }
      
      // Validate basic structure
      const validRules = rules.filter(rule => 
        rule.name && 
        rule.triggerKeywords && 
        Array.isArray(rule.triggerKeywords)
      );

      if (validRules.length === 0) {
        throw new Error('No valid rules found');
      }

      this.saveRules(validRules);
      return { success: true, imported: validRules.length };
    } catch (error) {
      console.error('Error importing rules:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Export rules to JSON
   */
  exportRules() {
    const rules = this.loadRules();
    return JSON.stringify(rules, null, 2);
  },

  /**
   * Reset to default rules
   */
  resetToDefaults() {
    this.saveRules(DEFAULT_RULES);
    return DEFAULT_RULES;
  },

  /**
   * Get rule statistics
   */
  getStatistics() {
    const rules = this.loadRules();
    const stats = {
      total: rules.length,
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => r.enabled === false).length,
      useAI: rules.filter(r => r.useAI).length,
      byCategory: {}
    };

    rules.forEach(rule => {
      const cat = rule.category || 'other';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });

    return stats;
  },

  /**
   * Validate rule
   */
  validateRule(rule) {
    const errors = [];

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!rule.triggerKeywords || !Array.isArray(rule.triggerKeywords) || rule.triggerKeywords.length === 0) {
      errors.push('At least one trigger keyword is required');
    }

    if (!rule.replyTemplate || rule.replyTemplate.trim().length === 0) {
      errors.push('Reply template is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * Template presets for quick rule creation
 */
export const TEMPLATE_PRESETS = [
  {
    name: 'Promoção',
    category: 'promotion',
    triggerKeywords: ['promoção', 'promocao', 'promo', 'desconto', 'oferta', 'ofertas'],
    replyTemplate: '🎉 PROMOÇÃO ESPECIAL!\n\n{PROMO_DESCRIPTION}\n\n⏰ Oferta válida até: {PROMO_EXPIRY}\n\nAgende agora e aproveite! 📲'
  },
  {
    name: 'Feedback',
    category: 'feedback',
    triggerKeywords: ['avaliação', 'avaliacao', 'avaliar', 'feedback', 'opinião', 'opiniao'],
    replyTemplate: '⭐ Sua opinião é muito importante!\n\nPor favor, avalie nosso serviço:\n\n👍 Gostou muito\n😐 Foi ok\n👎 Não gostou\n\nConte-nos como podemos melhorar! 🙏'
  },
  {
    name: 'Horário de Pico',
    category: 'info',
    triggerKeywords: ['lotado', 'cheio', 'espera', 'demora', 'fila'],
    replyTemplate: '⏳ Informamos que estamos em horário de pico!\n\nTempo médio de espera: ~{WAIT_TIME} minutos\n\nDeseja:\n1️⃣ Aguardar\n2️⃣ Marcar para outro horário\n3️⃣ Receber aviso quando chegar sua vez?'
  },
  {
    name: 'Formas de Pagamento',
    category: 'payment',
    triggerKeywords: ['pagamento', 'pagar', 'cartão', 'cartao', 'dinheiro', 'pix'],
    replyTemplate: '💳 Formas de pagamento aceitas:\n\n✅ Dinheiro\n✅ PIX ({PIX_KEY})\n✅ Cartão de Crédito/Débito\n✅ Voucher/Recompensa\n\nPagamento realizado no estabelecimento.'
  }
];

export default autoReplyService;
