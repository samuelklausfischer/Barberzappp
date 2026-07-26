const AI_GATEWAY_UNAVAILABLE =
  'A integracao de IA esta temporariamente indisponivel durante a manutencao de seguranca.';

/**
 * O navegador nunca acessa provedores de IA diretamente. F3 substituira este
 * adaptador por chamadas autenticadas ao gateway interno.
 */
export class AIService {
  readonly isAvailable = false;

  async generateResponse(_prompt: string, _tone: string, _instructions: string): Promise<string> {
    throw new Error(AI_GATEWAY_UNAVAILABLE);
  }
}

export const aiService = new AIService();