import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Trash2, RefreshCw } from 'lucide-react';

/**
 * PreviewChat Component
 * 
 * Live chat preview for testing AI secretary responses.
 */
export const PreviewChat = ({
  config = {},
  showSystemPrompt = true,
  className = '',
}) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const messagesEndRef = useRef(null);

  const secretaryName = config.secretaryName || 'Ana';
  const avatar = config.avatar || '';
  const welcomeMessage = config.welcomeMessage || 'Olá! Como posso ajudar você hoje?';
  const systemPrompt = config.systemPrompt || '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }
    ]);
  }, [welcomeMessage]);

  const generateMockResponse = (userMessage) => {
    const tone = config.tone || 'casual';
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('preço') || lowerMessage.includes('valor') || lowerMessage.includes('quanto')) {
      if (tone === 'formal') {
        return `Gostaria de informar que nossos serviços variam de R$ 30,00 a R$ 80,00. O corte masculino é R$ 50,00. Deseja agendar um horário?`;
      } else {
        return `Os preços vão de R$ 30 a R$ 80! O corte é 50 reais. Quer agendar um horário? 😊`;
      }
    }

    if (lowerMessage.includes('horário') || lowerMessage.includes('horarios') || lowerMessage.includes('funciona')) {
      const open = config.businessHours?.open || '09:00';
      const close = config.businessHours?.close || '18:00';
      if (tone === 'formal') {
        return `Funcionamos de segunda a sábado, das ${open} às ${close}. Domingos estamos fechados.`;
      } else {
        return `Abre de segunda a sábado, das ${open} às ${close}! Domingo fechado 🔒`;
      }
    }

    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar') || lowerMessage.includes('hora')) {
      if (tone === 'formal') {
        return `Perfeito! Para agendar um horário, preciso saber: qual dia você prefere e qual serviço gostaria de fazer?`;
      } else {
        return `Beleza! Que dia você quer vir? E qual serviço vai fazer? 💈`;
      }
    }

    if (lowerMessage.includes('endereço') || lowerMessage.includes('onde') || lowerMessage.includes('fica')) {
      const address = config.businessLocation?.address || 'Rua Principal, 123';
      if (tone === 'formal') {
        return `Estamos localizados em ${address}. Ficarei feliz em recebê-lo!`;
      } else {
        return `Tô aqui em ${address}! Pode vir conhecer! 📍`;
      }
    }

    const fallback = config.fallbackText || 'Desculpe, não entendi. Pode repetir?';
    return fallback;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = generateMockResponse(userMsg.content);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className={`flex flex-col bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-800/80 border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt={secretaryName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{secretaryName} - Preview</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-gray-400">Online • {config.tone || 'casual'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              title="Limpar chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              title="Reiniciar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-96 min-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt={secretaryName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                message.role === 'user'
                  ? 'bg-amber-500 text-slate-900 rounded-br-md'
                  : 'bg-slate-700/50 text-white rounded-bl-md'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700/50 p-4 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem para testar..."
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System Prompt Display */}
      {showSystemPrompt && systemPrompt && (
        <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
          <button
            onClick={() => setShowFullPrompt(!showFullPrompt)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              System Prompt Preview
            </span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showFullPrompt ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showFullPrompt && (
            <div className="mt-2 bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                {systemPrompt.substring(0, 500)}
                {systemPrompt.length > 500 && '...'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PreviewChat;
