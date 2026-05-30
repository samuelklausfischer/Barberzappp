const EVOLUTION_API_URL = 'https://01-evolution-api.25xe2c.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

interface EvolutionInstance {
  instanceName: string;
  status: string;
  phone?: string;
}

interface CreateInstanceParams {
  instanceName: string;
  phoneNumber: string;
  displayName: string;
}

const headers = {
  'apikey': API_KEY,
  'Content-Type': 'application/json',
};

export const evolutionService = {
  async listInstances(): Promise<EvolutionInstance[]> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao listar instâncias: ${response.status}`);
      }

      const data = await response.json();
      return data.instances || [];
    } catch (error) {
      console.error('Erro ao listar instâncias:', error);
      return [];
    }
  },

  async createInstance(params: CreateInstanceParams): Promise<{ success: boolean; instanceName?: string; error?: string }> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instanceName: params.instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          phoneNumber: params.phoneNumber,
          name: params.displayName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao criar instância: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, instanceName: data.instance?.instanceName };
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  async getInstanceStatus(instanceName: string): Promise<string> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar status: ${response.status}`);
      }

      const data = await response.json();
      return data.state || 'DISCONNECTED';
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      return 'DISCONNECTED';
    }
  },

  async getQrCode(instanceName: string): Promise<{ qrCode?: string; base64?: string; error?: string }> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/qrcode/${instanceName}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar QR: ${response.status}`);
      }

      const data = await response.json();
      return { 
        qrCode: data.qrcode?.code, 
        base64: data.qrcode?.base64 
      };
    } catch (error) {
      console.error('Erro ao buscar QR:', error);
      return { error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  async disconnectInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao desconectar: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },

  async deleteInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao deletar:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  },
};

export const generateInstanceName = (tenantId: string, displayName: string): string => {
  const slug = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 20);
  
  const tenantShort = tenantId.replace(/-/g, '').slice(0, 8);
  return `wa-${tenantShort}-${slug}`;
};
