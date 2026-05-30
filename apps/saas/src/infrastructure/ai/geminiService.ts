
import { GoogleGenAI } from "@google/genai";

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async generateResponse(prompt: string, tone: string, instructions: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: `Você é um assistente virtual de uma barbearia premium. 
          Seu tom de voz deve ser: ${tone}. 
          Instruções adicionais: ${instructions}.
          Responda como se estivesse no WhatsApp, use emojis quando apropriado. 
          Seja conciso e focado em agendamentos.`,
          temperature: 0.7,
        },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Desculpe, tive um problema técnico. Poderia repetir?";
    }
  }
}

export const aiService = new AIService();
