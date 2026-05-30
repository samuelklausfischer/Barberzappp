/**
 * WhatsApp Integration Page
 * 
 * Complete WhatsApp management interface with Evolution API integration.
 * Features:
 * - Connection status panel with QR code
 * - API configuration
 * - Test message sender
 * - Webhook logs
 * - Auto-reply rules management
 * 
 * Location: /root/Barberzap SITE/Framework/Pages/WhatsAppPage.jsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Send,
  QrCode,
  Download,
  Link,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Power,
  PowerOff,
  Clock,
  User,
  MessageSquare,
  Bot,
  Eye,
  EyeOff,
  ArrowClockwise,
  Trash,
  Phone
} from 'lucide-react';

// Components
import { StatCard } from '../CoreComponents';
import { DataTable } from '../CoreComponents';
import { Badge } from '../CoreComponents';
import { Button } from '../CoreComponents';
import { Input, Textarea } from '../CoreComponents';
import { Modal } from '../CoreComponents';
import { Toggle } from '../CoreComponents';
import { Alert } from '../CoreComponents';

// Services
import { evolutionAPI, mockEvolutionAPI, autoReplyService } from '../Logic';

/**
 * WhatsApp Page Component
 */
export const WhatsAppPage = () => {
  // Configuration state
  const [config, setConfig] = useState({});
  const [showConfig, setShowConfig] = useState(false);

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    state: 'unknown',
    instance: null,
    lastChecked: null
  });
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Test message state
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // Webhook logs state
  const [webhookLogs, setWebhookLogs] = useState([]);

  // Auto-reply rules state
  const [autoReplyRules, setAutoReplyRules] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    triggerKeywords: '',
    replyTemplate: '',
    enabled: true,
    useAI: false,
    category: 'custom'
  });

  // Use mock mode for development
  const [useMock, setUseMock] = useState(false);

  // Initialize
  useEffect(() => {
    loadConfig();
    loadAutoReplyRules();
    loadWebhookLogs();
    checkConnection();

    // Start polling for connection status
    startPolling();

    return () => {
      stopPolling();
    };
  }, []);

  /**
   * Load API configuration
   */
  const loadConfig = () => {
    const saved = evolutionAPI.loadConfig();
    setConfig(saved);
  };

  /**
   * Start polling for connection status
   */
  const startPolling = () => {
    checkConnection();
    const interval = setInterval(checkConnection, 60000); // Every 60 seconds
    setPollingInterval(interval);
  };

  /**
   * Stop polling
   */
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  /**
   * Check connection status
   */
  const checkConnection = async () => {
    setIsLoadingConnection(true);
    try {
      const api = useMock ? mockEvolutionAPI : evolutionAPI;
      const result = await api.checkConnectionState();
      setConnectionStatus(result);
      
      // Clear QR code if connected
      if (result.connected && result.state === 'open') {
        setQrCode(null);
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        state: 'error',
        error: error.message
      });
    } finally {
      setIsLoadingConnection(false);
    }
  };

  /**
   * Connect and get QR code
   */
  const handleConnect = async () => {
    try {
      const api = useMock ? mockEvolutionAPI : evolutionAPI;
      const result = await api.connectInstance();
      setQrCode(result.qrCode);
    } catch (error) {
      alert('Erro ao conectar: ' + error.message);
    }
  };

  /**
   * Disconnect/logout
   */
  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar?')) return;
    
    try {
      const api = useMock ? mockEvolutionAPI : evolutionAPI;
      await api.logoutInstance();
      setQrCode(null);
      checkConnection();
    } catch (error) {
      alert('Erro ao desconectar: ' + error.message);
    }
  };

  /**
   * Save configuration
   */
  const handleSaveConfig = () => {
    evolutionAPI.saveConfig(config);
    setShowConfig(false);
    checkConnection();
  };

  /**
   * Copy webhook URL
   */
  const handleCopyWebhookUrl = () => {
    const url = evolutionAPI.generateWebhookUrl();
    navigator.clipboard.writeText(url);
    alert('URL copiada!');
  };

  /**
   * Send test message
   */
  const handleSendMessage = async () => {
    if (!testPhone || !testMessage) {
      alert('Preencha o telefone e a mensagem');
      return;
    }

    setIsSendingMessage(true);
    setSendResult(null);

    try {
      const api = useMock ? mockEvolutionAPI : evolutionAPI;
      const result = await api.sendMessage(testPhone, testMessage);
      setSendResult({ type: 'success', message: result.message });
    } catch (error) {
      setSendResult({ type: 'error', message: error.message });
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * Load webhook logs
   */
  const loadWebhookLogs = () => {
    setWebhookLogs(evolutionAPI.getWebhookLogs());
  };

  /**
   * Load auto-reply rules
   */
  const loadAutoReplyRules = () => {
    setAutoReplyRules(autoReplyService.loadRules());
  };

  /**
   * Open rule modal for new rule
   */
  const handleNewRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      triggerKeywords: '',
      replyTemplate: '',
      enabled: true,
      useAI: false,
      category: 'custom'
    });
    setShowRuleModal(true);
  };

  /**
   * Open rule modal for editing
   */
  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      triggerKeywords: rule.triggerKeywords.join(', '),
      replyTemplate: rule.replyTemplate,
      enabled: rule.enabled,
      useAI: rule.useAI,
      category: rule.category
    });
    setShowRuleModal(true);
  };

  /**
   * Save rule
   */
  const handleSaveRule = () => {
    const keywords = ruleForm.triggerKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const ruleData = {
      ...ruleForm,
      triggerKeywords: keywords
    };

    const validation = autoReplyService.validateRule(ruleData);
    if (!validation.valid) {
      alert(validation.errors.join('\n'));
      return;
    }

    if (editingRule) {
      autoReplyService.updateRule(editingRule.id, ruleData);
    } else {
      autoReplyService.createRule(ruleData);
    }

    setShowRuleModal(false);
    loadAutoReplyRules();
  };

  /**
   * Delete rule
   */
  const handleDeleteRule = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
      autoReplyService.deleteRule(id);
      loadAutoReplyRules();
    }
  };

  /**
   * Toggle rule
   */
  const handleToggleRule = (id) => {
    autoReplyService.toggleRule(id);
    loadAutoReplyRules();
  };

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  /**
   * Simulate incoming webhook message (for testing)
   */
  const handleSimulateWebhook = () => {
    const mockMessage = {
      from: '5511987654321@s.whatsapp.net',
      fromName: 'Cliente Teste',
      message: 'Olá, gostaria de agendar um corte',
      timestamp: new Date().toISOString()
    };
    
    evolutionAPI.logIncomingMessage({
      key: { remoteJid: mockMessage.from },
      pushName: mockMessage.fromName,
      message: { conversation: mockMessage.message }
    });
    
    loadWebhookLogs();
  };

  return (
    <div className="p-6 md:p-8 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-emerald-400" />
              Integração WhatsApp
            </h1>
            <p className="text-gray-400 mt-1">
              Gerencie sua conexão e regras de resposta automática
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfig(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar API
            </Button>
            <Button
              variant="outline"
              onClick={() => setUseMock(!useMock)}
            >
              {useMock ? 'Modo Mock ON' : 'Modo Real'}
            </Button>
          </div>
        </div>
      </div>

      {/* Connection Status Panel */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Status Indicator */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                connectionStatus.connected 
                  ? 'bg-emerald-500/15' 
                  : connectionStatus.state === 'error'
                  ? 'bg-red-500/15'
                  : 'bg-amber-500/15'
              }`}>
                {connectionStatus.connected ? (
                  <Wifi className="w-8 h-8 text-emerald-400" />
                ) : connectionStatus.state === 'error' ? (
                  <XCircle className="w-8 h-8 text-red-400" />
                ) : (
                  <WifiOff className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
                </h2>
                <p className="text-gray-400 text-sm">
                  Instância: {config.instanceName || 'Não configurado'}
                </p>
              </div>
            </div>

            {/* Status Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <Clock className="w-3 h-3" />
                  Estado
                </div>
                <p className="text-white font-medium">
                  {connectionStatus.state ? connectionStatus.state.toUpperCase() : 'DESCONHECIDO'}
                </p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                  <RefreshCw className="w-3 h-3" />
                  Última verificação
                </div>
                <p className="text-white font-medium text-sm">
                  {connectionStatus.lastChecked 
                    ? formatTimestamp(connectionStatus.lastChecked)
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Area */}
          <div className="flex-shrink-0">
            {qrCode ? (
              <div className="bg-white rounded-xl p-4">
                <img 
                  src={qrCode} 
                  alt="QR Code para conexão" 
                  className="w-48 h-48 mx-auto"
                />
                <p className="text-center text-gray-600 text-xs mt-2">
                  Escaneie com WhatsApp
                </p>
              </div>
            ) : (
              <div className="w-52 h-52 bg-slate-900/50 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-700">
                <QrCode className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm text-center px-4">
                  {connectionStatus.connected 
                    ? 'WhatsApp conectado' 
                    : 'Conecte para exibir o QR Code'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={checkConnection}
              loading={isLoadingConnection}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            {!connectionStatus.connected && (
              <Button
                onClick={handleConnect}
                variant="primary"
              >
                <Power className="w-4 h-4 mr-2" />
                Conectar
              </Button>
            )}
            {connectionStatus.connected && (
              <Button
                onClick={handleDisconnect}
                variant="danger"
              >
                <PowerOff className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={MessageSquare}
          value={webhookLogs.length}
          label="Mensagens recebidas"
          className="!bg-slate-800/50"
        />
        <StatCard
          icon={Bot}
          value={autoReplyRules.filter(r => r.enabled).length}
          label="Regras ativas"
          className="!bg-slate-800/50"
        />
        <StatCard
          icon={User}
          value={config.instanceName || '-'}
          label="Instância ativa"
          className="!bg-slate-800/50"
        />
      </div>

      {/* Test Message & Webhook Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Test Message Sender */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-400" />
            Enviar Mensagem de Teste
          </h3>
          
          <div className="space-y-4">
            <Input
              label="Telefone (com DDD)"
              placeholder="Ex: 11987654321"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              type="tel"
              leftIcon={<Phone className="w-5 h-5" />}
            />
            
            <Textarea
              label="Mensagem"
              placeholder="Digite sua mensagem..."
              rows={4}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
            
            <Button
              onClick={handleSendMessage}
              loading={isSendingMessage}
              disabled={!connectionStatus.connected}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>

            {sendResult && (
              <Alert
                variant={sendResult.type}
                dismissible
                onDismiss={() => setSendResult(null)}
              >
                {sendResult.message}
              </Alert>
            )}

            {!connectionStatus.connected && (
              <Alert variant="warning">
                Conecte o WhatsApp para enviar mensagens
              </Alert>
            )}
          </div>
        </div>

        {/* Webhook Logs */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              Logs de Webhook
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSimulateWebhook}
            >
              Simular
            </Button>
          </div>

          <DataTable
            columns={[
              {
                key: 'timestamp',
                label: 'Hora',
                render: (value) => (
                  <span className="text-gray-400 text-sm">
                    {formatTimestamp(value).split(' ')[1]}
                  </span>
                )
              },
              {
                key: 'fromName',
                label: 'De',
                render: (value, row) => (
                  <div>
                    <div className="text-white font-medium text-sm">{value}</div>
                    <div className="text-gray-500 text-xs">
                      {evolutionAPI.formatPhone(row.from)}
                    </div>
                  </div>
                )
              },
              {
                key: 'message',
                label: 'Mensagem',
                render: (value) => (
                  <div className="text-white text-sm truncate max-w-[200px]">
                    {value}
                  </div>
                )
              }
            ]}
            data={webhookLogs.slice(0, 5)}
            emptyMessage="Nenhuma mensagem recebida ainda"
          />
        </div>
      </div>

      {/* Auto-Reply Rules */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              Regras de Resposta Automática
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Configure respostas automáticas com base em palavras-chave
            </p>
          </div>
          <Button onClick={handleNewRule}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </div>

        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Nome',
              render: (value, row) => (
                <div className="flex items-center gap-3">
                  <div className="text-white font-medium">{value}</div>
                  {row.useAI && (
                    <Badge variant="info" size="sm">
                      <Bot className="w-3 h-3 mr-1" />
                      IA
                    </Badge>
                  )}
                  {row.enabled ? (
                    <Badge variant="success">Ativo</Badge>
                  ) : (
                    <Badge variant="default">Inativo</Badge>
                  )}
                </div>
              )
            },
            {
              key: 'triggerKeywords',
              label: 'Palavras-chave',
              render: (value) => (
                <div className="flex flex-wrap gap-1">
                  {value.slice(0, 3).map((keyword, i) => (
                    <Badge key={i} variant="ghost" size="sm">
                      {keyword}
                    </Badge>
                  ))}
                  {value.length > 3 && (
                    <Badge variant="ghost" size="sm">
                      +{value.length - 3}
                    </Badge>
                  )}
                </div>
              )
            },
            {
              key: 'replyTemplate',
              label: 'Resposta',
              render: (value) => (
                <div className="text-gray-400 text-sm truncate max-w-[250px]">
                  {value}
                </div>
              )
            },
            {
              key: 'priority',
              label: 'Prioridade'
            }
          ]}
          data={autoReplyRules}
          actions={(row) => (
            <div className="flex items-center gap-2">
              <Toggle
                checked={row.enabled}
                onChange={() => handleToggleRule(row.id)}
                size="sm"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEditRule(row)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRule(row.id)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          emptyMessage="Nenhuma regra configurada"
        />
      </div>

      {/* API Configuration Modal */}
      <Modal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        title="Configuração da API (Evolution)"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="URL Base da API"
            placeholder="http://localhost:8080"
            value={config.apiBaseUrl || ''}
            onChange={(e) => setConfig({ ...config, apiBaseUrl: e.target.value })}
          />
          
          <Input
            label="Chave da API (API Key)"
            placeholder="Sua chave de autenticação"
            value={config.apiKey || ''}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            type="password"
          />
          
          <Input
            label="Nome da Instância"
            placeholder="barberzap01"
            value={config.instanceName || ''}
            onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
          />
          
          <Input
            label="URL do Webhook"
            value={evolutionAPI.generateWebhookUrl()}
            disabled
            containerClassName="!mb-2"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyWebhookUrl}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar URL do Webhook
          </Button>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowConfig(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveConfig}>
            Salvar Configurações
          </Button>
        </div>
      </Modal>

      {/* Rule Modal */}
      <Modal
        isOpen={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRule ? 'Editar Regra' : 'Nova Regra'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nome da Regra"
            placeholder="Ex: Bem-vindo"
            value={ruleForm.name}
            onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
          />
          
          <Input
            label="Palavras-chave (separadas por vírgula)"
            placeholder="Ex: oi, olá, hello, hi"
            value={ruleForm.triggerKeywords}
            onChange={(e) => setRuleForm({ ...ruleForm, triggerKeywords: e.target.value })}
            helperText="Quais palavras devem ativar esta resposta?"
          />
          
          <Textarea
            label="Resposta"
            placeholder="Digite a resposta automática..."
            rows={6}
            value={ruleForm.replyTemplate}
            onChange={(e) => setRuleForm({ ...ruleForm, replyTemplate: e.target.value })}
            helperText="Use {BARBERSHOP_NAME} para inserir o nome da barbearia"
          />
          
          <div className="flex items-center gap-4">
            <Toggle
              checked={ruleForm.enabled}
              onChange={(checked) => setRuleForm({ ...ruleForm, enabled: checked })}
              label="Regra Ativa"
            />
            
            <Toggle
              checked={ruleForm.useAI}
              onChange={(checked) => setRuleForm({ ...ruleForm, useAI: checked })}
              label="Usar IA"
              description="Aprimorar resposta com IA"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowRuleModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveRule}>
            {editingRule ? 'Atualizar' : 'Criar'} Regra
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WhatsAppPage;
