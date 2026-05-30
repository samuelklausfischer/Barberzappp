import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Save, 
  RotateCcw, 
  MessageSquare, 
  Clock, 
  MapPin,
  Phone,
  Settings as SettingsIcon,
  Sparkles,
  BrainCircuit,
  BookOpen,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Upload,
  Slack,
  User,
} from 'lucide-react';
import { 
  Input,
  Button,
  Toggle,
  Slider,
  Select,
  StatCard,
  Alert,
} from '../CoreComponents';
import { PreviewChat } from '../Components/IA';
import {
  getIAConfig,
  saveIAConfig,
  resetIAConfig,
  updateIAConfigSection,
  toggleSpecialistAgent,
  generateSystemPrompt,
  validateIAConfig,
  TONE_OPTIONS,
  MODEL_OPTIONS,
  DEFAULT_IA_CONFIG,
} from '../Logic/iaConfig';

/**
 * IAConfigPage - AI Secretary Configuration Page
 * 
 * Complete configuration interface for the virtual secretary.
 */
export const IAConfigPage = () => {
  const [config, setConfig] = useState(DEFAULT_IA_CONFIG);
  const [activeTab, setActiveTab] = useState('identity');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    setConfig(getIAConfig());
  };

  const handleSave = () => {
    const validation = validateIAConfig(config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    setValidationErrors([]);
    saveIAConfig(config);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    const reset = resetIAConfig();
    setConfig(reset);
    setShowResetConfirm(false);
    setValidationErrors([]);
  };

  const handleFieldChange = (section, field, value) => {
    setConfig(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value,
          },
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSpecialistToggle = (agentKey) => {
    const updated = toggleSpecialistAgent(agentKey);
    setConfig(updated);
  };

  const tabs = [
    { id: 'identity', label: 'Identidade', icon: User },
    { id: 'tone', label: 'Voz & Tom', icon: MessageSquare },
    { id: 'model', label: 'Modelo', icon: BrainCircuit },
    { id: 'specialists', label: 'Especialistas', icon: Sparkles },
    { id: 'knowledge', label: 'Conhecimento', icon: BookOpen },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Bot className="w-8 h-8 text-amber-400" />
            Configuração da IA
          </h1>
          <p className="text-gray-400 mt-1">
            Personalize sua secretária virtual Ana
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleReset}
            variant="outline"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Resetar
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="error">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Erros de Validação</p>
            <ul className="mt-1 list-disc list-inside">
              {validationErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <Alert variant="success">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Configuração Salva!</p>
            <p className="text-sm">As alterações foram aplicadas com sucesso.</p>
          </div>
        </Alert>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-900'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            {/* Identity Tab */}
            {activeTab === 'identity' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nome da Secretária
                  </label>
                  <Input
                    value={config.secretaryName}
                    onChange={(e) => handleFieldChange(null, 'secretaryName', e.target.value)}
                    placeholder="Ex: Ana, Maria, João..."
                    className="w-full"
                  />
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Foto de Perfil
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden border-2 border-amber-500/30">
                      {config.avatar ? (
                        <img src={config.avatar} alt={config.secretaryName} className="w-full h-full object-cover" />
                      ) : (
                        <Bot className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        JPG, PNG ou GIF. Máximo 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Mensagem de Boas-vindas
                  </label>
                  <textarea
                    value={config.welcomeMessage}
                    onChange={(e) => handleFieldChange(null, 'welcomeMessage', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
                    placeholder="Ex: Olá! Bem-vindo à nossa barbearia. Como posso ajudar?"
                  />
                </div>

                {/* Business Hours */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Horário de Funcionamento
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Abertura</label>
                      <Input
                        type="time"
                        value={config.businessHours.open}
                        onChange={(e) => handleFieldChange('businessHours', 'open', e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fechamento</label>
                      <Input
                        type="time"
                        value={config.businessHours.close}
                        onChange={(e) => handleFieldChange('businessHours', 'close', e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Location */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Localização
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Endereço</label>
                      <Input
                        value={config.businessLocation.address}
                        onChange={(e) => handleFieldChange('businessLocation', 'address', e.target.value)}
                        placeholder="Rua, número, bairro..."
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                      <Input
                        value={config.businessLocation.city}
                        onChange={(e) => handleFieldChange('businessLocation', 'city', e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Estado</label>
                      <Input
                        value={config.businessLocation.state}
                        onChange={(e) => handleFieldChange('businessLocation', 'state', e.target.value)}
                        placeholder="Ex: SP"
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                      <Input
                    value={config.businessLocation.phone}
                    onChange={(e) => handleFieldChange('businessLocation', 'phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full"
                  />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tone Tab */}
            {activeTab === 'tone' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Tom de Voz
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone.value}
                        onClick={() => handleFieldChange(null, 'tone', tone.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          config.tone === tone.value
                            ? 'border-amber-500 bg-amber-500/15 text-amber-400'
                            : 'border-slate-700 bg-slate-700/30 text-gray-400 hover:border-slate-600 hover:text-white'
                        }`}
                      >
                        <p className="font-medium">{tone.label}</p>
                        <p className="text-xs mt-1">{tone.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone Templates */}
                <div className="space-y-4">
                  {[
                    { key: 'greeting', label: 'Modelo de Saudação' },
                    { key: 'scheduling', label: 'Modelo de Agendamento' },
                    { key: 'pricing', label: 'Preços' },
                    { key: 'location', label: 'Localização' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        {field.label}
                      </label>
                      <textarea
                        value={config.toneConfig[field.key] || ''}
                        onChange={(e) => handleFieldChange('toneConfig', field.key, e.target.value)}
                        rows={2}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none text-sm"
                        placeholder={`Modelo para ${field.label.toLowerCase()}...`}
                      />
                    </div>
                  ))}
                </div>

                {/* Fallback Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Texto de Fallback (quando não entender)
                  </label>
                  <textarea
                    value={config.fallbackText}
                    onChange={(e) => handleFieldChange(null, 'fallbackText', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none text-sm"
                    placeholder="O que dizer quando não entender a mensagem..."
                  />
                </div>
              </div>
            )}

            {/* Model Tab */}
            {activeTab === 'model' && (
              <div className="space-y-6">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Modelo de IA
                  </label>
                  <div className="space-y-2">
                    {MODEL_OPTIONS.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => handleFieldChange(null, 'model', model.value)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                          config.model === model.value
                            ? 'border-amber-500 bg-amber-500/15'
                            : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${config.model === model.value ? 'text-amber-400' : 'text-white'}`}>
                            {model.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{model.description}</p>
                        </div>
                        {config.model === model.value && (
                          <CheckCircle className="w-5 h-5 text-amber-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temperature Slider */}
                <div>
                  <Slider
                    value={config.temperature}
                    onChange={(value) => handleFieldChange(null, 'temperature', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    label="Criatividade (Temperatura)"
                    helperText="0 = Mais preciso, 1 = Mais criativo"
                  />
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Máximo de Tokens
                  </label>
                  <Input
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => handleFieldChange(null, 'maxTokens', parseInt(e.target.value))}
                    min={100}
                    max={4000}
                    className="w-full"
                    helperText="Limite de caracteres da resposta"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" />
                    Prompt do Sistema (Avançado)
                  </label>
                  <textarea
                    value={config.systemPrompt}
                    onChange={(e) => handleFieldChange(null, 'systemPrompt', e.target.value)}
                    rows={10}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none font-mono text-xs"
                    placeholder="Instruções avançadas para a IA..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Use variáveis: {'{secretaryName}'}, {'{tone}'}, {'{services}'}, {'{businessHours}'}
                  </p>
                </div>
              </div>
            )}

            {/* Specialists Tab */}
            {activeTab === 'specialists' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">
                    Agentes Especialistas
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {Object.values(config.specialistAgents).filter(a => a.enabled).length} ativados
                    </span>
                  </div>
                </div>

                {Object.entries(config.specialistAgents).map(([key, agent]) => (
                  <div
                    key={key}
                    className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{agent.icon}</span>
                        <div>
                          <h4 className="font-medium text-white">{agent.label}</h4>
                          <p className="text-sm text-gray-400 mt-1">{agent.description}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={agent.enabled}
                        onChange={() => handleSpecialistToggle(key)}
                        showLabel={false}
                      />
                    </div>
                  </div>
                ))}

                <div className="mt-6 p-4 bg-slate-700/20 rounded-xl border border-slate-700/30">
                  <p className="text-sm text-gray-400">
                    💡 <strong className="text-white">Dica:</strong> Cada especialista lida com um tipo específico de interação. 
                    Desative especialistas que você não quer que a IA use.
                  </p>
                </div>
              </div>
            )}

            {/* Knowledge Tab */}
            {activeTab === 'knowledge' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Base de Conhecimento
                  </h3>
                </div>

                {/* Services Import */}
                <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">Catálogo de Serviços</h4>
                      <p className="text-xs text-gray-400">
                        Sincronizado da página Serviços
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Importar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {config.knowledgeBase?.services?.length || 0} serviços importados
                  </p>
                </div>

                {/* Hours Import */}
                <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-white">Horário de Funcionamento</h4>
                      <p className="text-xs text-gray-400">
                        Sincronizado da página Horários
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Importar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {config.businessHours.open} - {config.businessHours.close}
                  </p>
                </div>

                {/* Custom FAQ */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    FAQ Personalizado
                  </label>
                  <textarea
                    value={config.knowledgeBase.faqCustom || ''}
                    onChange={(e) => handleFieldChange('knowledgeBase', 'faqCustom', e.target.value)}
                    rows={8}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none text-sm"
                    placeholder="Pergunta: Resposta&#10;Pergunta 2: Resposta 2&#10;..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Formato: Pergunta seguida de resposta (um por linha)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Preview & Analytics */}
        <div className="space-y-6">
          {/* Analytics StatCards */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Estatísticas
            </h3>
            <div className="space-y-3">
              <StatCard
                icon={MessageSquare}
                value={config.analytics?.messagesHandled || 1250}
                label="Mensagens"
                className="p-4"
                compact
              />
              <StatCard
                icon={CheckCircle}
                value={`${config.analytics?.successRate || 94.5}%`}
                label="Taxa de Sucesso"
                className="p-4"
                compact
              />
              <StatCard
                icon={AlertCircle}
                value={config.analytics?.escalatesToHuman || 69}
                label="Transferências"
                className="p-4"
                compact
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Slack className="w-4 h-4" />
              Preview ao Vivo
            </h3>
            <PreviewChat
              config={config}
              showSystemPrompt={true}
              className="shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Resetar Configuração?</h3>
                <p className="text-sm text-gray-400">
                  Isso restaurará todas as configurações aos valores padrão
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-300 bg-slate-900/50 rounded-lg p-4 mb-6">
              Você perderá todas as personalizações feitas. Deseja continuar?
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => setShowResetConfirm(false)}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmReset}
                variant="danger"
              >
                Sim, Resetar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IAConfigPage;
