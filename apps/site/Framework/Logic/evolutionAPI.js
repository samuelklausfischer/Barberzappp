/**
 * Evolution API Wrapper
 * 
 * Handles communication with Evolution API for WhatsApp integration.
 * 
 * @module evolutionAPI
 */

const STORAGE_KEYS = {
  CONFIG: 'barberzap_whatsapp_config',
  STATUS: 'barberzap_whatsapp_status',
  LOGS: 'barberzap_webhook_logs'
};

/**
 * Default configuration for Evolution API
 */
const DEFAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:8080',
  apiKey: '',
  instanceName: 'barberzap01',
  webhookUrl: ''
};

/**
 * Evolution API Service
 */
export const evolutionAPI = {
  /**
   * Load configuration from localStorage
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
      return DEFAULT_CONFIG;
    }
  },

  /**
   * Save configuration to localStorage
   */
  saveConfig(config) {
    try {
      const toSave = {
        apiBaseUrl: config.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl,
        apiKey: config.apiKey || '',
        instanceName: config.instanceName || DEFAULT_CONFIG.instanceName,
        webhookUrl: config.webhookUrl || this.generateWebhookUrl()
      };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(toSave));
      return true;
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      return false;
    }
  },

  /**
   * Generate webhook URL for the current instance
   */
  generateWebhookUrl() {
    const config = this.loadConfig();
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/whatsapp/webhook/${config.instanceName}`;
  },

  /**
   * Get API headers with authentication
   */
  getHeaders() {
    const config = this.loadConfig();
    return {
      'Content-Type': 'application/json',
      'apikey': config.apiKey
    };
  },

  /**
   * Check connection status
   * @returns {Promise<Object>} Connection state
   */
  async checkConnectionState() {
    const config = this.loadConfig();
    
    if (!config.apiKey) {
      return {
        success: false,
        state: 'unconfigured',
        message: 'API not configured'
      };
    }

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/instance/connectionState/${config.instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Save status to localStorage
      const status = {
        state: data.instance?.state || 'unknown',
        connected: data.instance?.state === 'open',
        lastChecked: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.STATUS, JSON.stringify(status));

      return {
        success: true,
        ...status
      };
    } catch (error) {
      console.error('Error checking connection state:', error);
      
      // Return cached status if available
      const cached = localStorage.getItem(STORAGE_KEYS.STATUS);
      if (cached) {
        return { ...JSON.parse(cached), error: true, message: error.message };
      }

      return {
        success: false,
        state: 'error',
        connected: false,
        message: error.message
      };
    }
  },

  /**
   * Connect instance and get QR code
   * @returns {Promise<Object>} QR code data
   */
  async connectInstance() {
    const config = this.loadConfig();
    
    if (!config.apiKey) {
      throw new Error('API key not configured');
    }

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/instance/connect/${config.instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        qrCode: data.base64 || data.qrcode?.code,
        terminalCode: data.terminal,
        pairCode: data.pairingCode,
        message: 'QR code generated successfully'
      };
    } catch (error) {
      console.error('Error connecting instance:', error);
      throw error;
    }
  },

  /**
   * Logout/disconnect instance
   * @returns {Promise<Object>}
   */
  async logoutInstance() {
    const config = this.loadConfig();
    
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/instance/logout/${config.instanceName}`,
        {
          method: 'DELETE',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Clear cached status
      localStorage.removeItem(STORAGE_KEYS.STATUS);

      return {
        success: true,
        message: 'Instance logged out successfully'
      };
    } catch (error) {
      console.error('Error logging out instance:', error);
      throw error;
    }
  },

  /**
   * Send text message
   * @param {string} phone - Phone number (with country code, no +)
   * @param {string} message - Message content
   * @returns {Promise<Object>}
   */
  async sendMessage(phone, message) {
    const config = this.loadConfig();
    
    if (!config.apiKey) {
      throw new Error('API key not configured');
    }

    // Clean phone number (remove +, spaces, dashes)
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // Add country code if not present (default Brazil 55)
    const formattedPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/message/sendText/${config.instanceName}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            number: `${formattedPhone}@c.us`,
            text: message,
            delay: 1200
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.key ? true : false,
        messageId: data.key?.id,
        timestamp: data.messageTimestamp,
        message: 'Message sent successfully'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Get webhook configuration
   * @returns {Promise<Object>}
   */
  async getWebhookConfig() {
    const config = this.loadConfig();
    
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/webhook/find/${config.instanceName}`,
        {
          method: 'GET',
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        webhookUrl: data.url,
        events: data.webhook_by_events || [],
        message: 'Webhook configuration retrieved'
      };
    } catch (error) {
      console.error('Error getting webhook config:', error);
      throw error;
    }
  },

  /**
   * Set webhook URL
   * @param {string} url - Webhook URL
   * @param {Array<string>} events - Events to subscribe
   * @returns {Promise<Object>}
   */
  async setWebhook(url, events = ['MESSAGES_UPSERT', 'SEND_MESSAGE']) {
    const config = this.loadConfig();
    
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/webhook/set/${config.instanceName}`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            url: url,
            webhook_by_events: events
          })
        }
      );

      if (!reaction.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return {
        success: true,
        message: 'Webhook configured successfully'
      };
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  },

  /**
   * Log incoming webhook message
   * @param {Object} message - Message data from webhook
   */
  logIncomingMessage(message) {
    try {
      const logs = this.getWebhookLogs();
      const newLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        from: message.key?.remoteJid || 'unknown',
        fromName: message.pushName || 'Unknown',
        message: message.message?.conversation || 
                  message.message?.extendedTextMessage?.text || 
                  '[Non-text message]',
        status: 'received'
      };
      
      // Keep only last 100 logs
      const updatedLogs = [newLog, ...logs].slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
      
      return newLog;
    } catch (error) {
      console.error('Error logging message:', error);
    }
  },

  /**
   * Get webhook logs
   * @returns {Array} Array of message logs
   */
  getWebhookLogs() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading webhook logs:', error);
      return [];
    }
  },

  /**
   * Clear webhook logs
   */
  clearWebhookLogs() {
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  },

  /**
   * Get connection status from cache
   */
  getCachedStatus() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATUS);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Format phone number for display
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhone(phone) {
    // Remove @c.us suffix if present
    const cleanPhone = phone.replace('@c.us', '').replace(/\D/g, '');
    
    if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      // Brazil format: +55 (11) 98765-4321
      const ddd = cleanPhone.substring(2, 4);
      const first = cleanPhone.substring(4, 9);
      const second = cleanPhone.substring(9, 13);
      return `+55 (${ddd}) ${first}-${second}`;
    }
    
    return `+${cleanPhone}`;
  }
};

/**
 * Mock connection for testing without actual Evolution API
 */
export const mockEvolutionAPI = {
  async checkConnectionState() {
    return {
      success: true,
      state: 'open',
      connected: true,
      instance: 'barberzap01',
      lastChecked: new Date().toISOString()
    };
  },

  async connectInstance() {
    return {
      success: true,
      qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSIxMDAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9ImJsYWNrIiBmb250LXNpemU9IjE0Ij5NU0NRIENvZGU8L3RleHQ+PC9zdmc+',
      message: 'QR code generated (mock)'
    };
  },

  async sendMessage(phone, message) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    return {
      success: true,
      messageId: `fake_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      message: 'Message sent successfully (mock)',
      to: cleanPhone
    };
  },

  async logoutInstance() {
    return {
      success: true,
      message: 'Logged out successfully (mock)'
    };
  }
};

export default evolutionAPI;
