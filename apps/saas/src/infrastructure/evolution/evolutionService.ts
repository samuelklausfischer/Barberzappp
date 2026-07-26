const WHATSAPP_GATEWAY_UNAVAILABLE =
  'A integracao de WhatsApp esta temporariamente indisponivel durante a manutencao de seguranca.';

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

/**
 * Nenhuma credencial de Evolution API pode existir no navegador. F3 substituira
 * este adaptador por chamadas autenticadas ao gateway interno.
 */
export const evolutionService = {
  async listInstances(): Promise<EvolutionInstance[]> {
    throw new Error(WHATSAPP_GATEWAY_UNAVAILABLE);
  },

  async createInstance(_params: CreateInstanceParams): Promise<{ success: boolean; instanceName?: string; error?: string }> {
    return { success: false, error: WHATSAPP_GATEWAY_UNAVAILABLE };
  },

  async getInstanceStatus(_instanceName: string): Promise<string> {
    return 'UNAVAILABLE';
  },

  async getQrCode(_instanceName: string): Promise<{ qrCode?: string; base64?: string; error?: string }> {
    return { error: WHATSAPP_GATEWAY_UNAVAILABLE };
  },

  async disconnectInstance(_instanceName: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: WHATSAPP_GATEWAY_UNAVAILABLE };
  },

  async deleteInstance(_instanceName: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: WHATSAPP_GATEWAY_UNAVAILABLE };
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