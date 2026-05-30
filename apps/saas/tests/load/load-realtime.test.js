/**
 * BarberZap - Load Testing: Realtime/WebSocket
 * Testa conexões WebSocket, subscrições e latência de mensagens
 * 
 * Métricas alvo:
 * - Message latency: <100ms
 * - Auto-reconnect: <5s
 * - No disconnections under load
 * - Subscribe success rate: 99.9%
 * 
 * Uso:
 * k6 run --env BASE_URL=http://localhost:3000 tests/load/load-realtime.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=baseline tests/load/load-realtime.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=stress tests/load/load-realtime.test.js
 * 
 * NOTA: Este teste usa WebSocket nativo. Se estiver usando Supabase Realtime,
 * você pode precisar adaptar para usar a biblioteca @supabase/realtime-js
 */

import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || BASE_URL.replace('http', 'ws') + '/realtime/v1';
const SUPABASE_URL = __ENV.SUPABASE_URL || __ENV.BASE_URL || 'http://localhost:3000';
const SUPABASE_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';
const SCENARIO = __ENV.SCENARIO || 'concurrent_20';

// ============================================================================
// MÉTRICAS CUSTOMIZADAS
// ============================================================================

const connectionErrorRate = new Rate('ws_connection_errors');
const messageLatency = new Trend('ws_message_latency');
const connectionDuration = new Trend('ws_connection_duration');
const subscribeDuration = new Trend('ws_subscribe_duration');
const reconnectTime = new Trend('ws_reconnect_time');

const successfulConnections = new Counter('ws_successful_connections');
const failedConnections = new Counter('ws_failed_connections');
const messagesReceived = new Counter('ws_messages_received');
const messagesSent = new Counter('ws_messages_sent');
const disconnections = new Counter('ws_disconnections');

// ============================================================================
// CONFIGURAÇÃO DE CENÁRIOS
// ============================================================================

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 1,
      duration: '5m',
    },
    concurrent_20: {
      executor: 'constant-vus',
      vus: 20,
      duration: '10m',
    },
    concurrent_50: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 10 },
      ],
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '3m', target: 100 },
        { duration: '3m', target: 150 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    // Performance targets
    'ws_message_latency': [
      'p(50)<50',
      'p(95)<100',
      'p(99)<200',
    ],
    'ws_connection_errors': ['rate<0.01'],
    'ws_subscribe_duration': [
      'p(95)<500',
      'p(99)<1000',
    ],
    'ws_reconnect_time': [
      'p(95)<3000',  // 95% das reconexões em <3s
      'p(99)<5000',  // 99% das reconexões em <5s
    ],
  },
};

const selectedScenario = SCENARIO in options.scenarios ? SCENARIO : 'concurrent_20';
options.scenarios = { [selectedScenario]: options.scenarios[selectedScenario] };

// ============================================================================
// DADOS DE TESTE
// ============================================================================

const channels = [
  'appointments',
  'notifications',
  'chat',
  'status',
];

const testUsers = Array.from({ length: 50 }, (_, i) => ({
  userId: `user_${i + 1}`,
  shopId: `shop_${(i % 5) + 1}`,
}));

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Classe WebSocketConnection wrapper para gerenciar conexão
 */
class WebSocketConnection {
  constructor(userId, shopId) {
    this.userId = userId;
    this.shopId = shopId;
    this.socket = null;
    this.connected = false;
    this.subscribed = false;
    this.messages = [];
    this.messageCount = 0;
    this.reconnectAttempts = 0;
  }

  /**
   * Conecta ao WebSocket
   */
  connect() {
    const connectStart = new Date().getTime();

    // URL de conexão Supabase Realtime
    const url = `${WS_URL}?apikey=${SUPABASE_KEY}&vsn=1.0.0`;

    try {
      this.socket = new WebSocket(url);

      // Configurar handlers
      this.socket.onopen = () => {
        const connectTime = new Date().getTime() - connectStart;
        connectionDuration.add(connectTime);
        this.connected = true;
        successfulConnections.add(1);

        console.log(`[${this.userId}] Connected in ${connectTime}ms`);

        // Enviar heartbeat inicial
        this.sendHeartbeat();
      };

      this.socket.onclose = (event) => {
        this.connected = false;
        this.subscribed = false;
        disconnections.add(1);

        console.log(`[${this.userId}] Disconnected. Code: ${event.code}, Reason: ${event.reason}`);

        // Tentar reconectar
        if (this.reconnectAttempts < 5) {
          this.reconnect();
        }
      };

      this.socket.onerror = (error) => {
        connectionErrorRate.add(1);
        failedConnections.add(1);
        console.error(`[${this.userId}] WebSocket error:`, error);
      };

      this.socket.onmessage = (event) => {
        this handleMessage(event);
      };

    } catch (error) {
      connectionErrorRate.add(1);
      failedConnections.add(1);
      console.error(`[${this.userId}] Connection error:`, error);
      return false;
    }

    return true;
  }

  /**
   * Reconecta automaticamente
   */
  reconnect() {
    const reconnectStart = new Date().getTime();
    this.reconnectAttempts++;

    console.log(`[${this.userId}] Reconnecting (attempt ${this.reconnectAttempts})...`);

    setTimeout(() => {
      if (this.connect()) {
        const reconnectTime = new Date().getTime() - reconnectStart;
        reconnectTime.add(reconnectTime);
        console.log(`[${this.userId}] Reconnected in ${reconnectTime}ms`);
        
        // Re-subscribes
        this.subscribeToChannel();
        this.subscribed = true;
      }
    }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000));
  }

  /**
   * Envia heartbeat
   */
  sendHeartbeat() {
    const payload = {
      topic: 'phoenix',
      event: 'heartbeat',
      payload: {},
      ref: this.messageCount++,
    };

    this.send(JSON.stringify(payload));
    messagesSent.add(1);
  }

  /**
   * Envia mensagem
   */
  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    }
    return false;
  }

  /**
   * Processa mensagem recebida
   */
  handleMessage(event) {
    const receiveTime = new Date().getTime();

    try {
      const message = typeof event.data === 'string' ? 
        JSON.parse(event.data) : event.data;

      messagesReceived.add(1);
      this.messages.push({
        data: message,
        timestamp: receiveTime,
      });

      // Calcular latência se a mensagem tiver timestamp
      if (message.payload && message.payload.sentAt) {
        const latency = receiveTime - message.payload.sentAt;
        messageLatency.add(latency);
      }

      // Responder a mensagens de subscription
      if (message.event === 'phx_reply' && message.payload.status === 'ok') {
        this.subscribed = true;
      }

    } catch (error) {
      console.error(`[${this.userId}] Error parsing message:`, error);
    }
  }

  /**
   * Subscreve em um canal
   */
  subscribeToChannel(channel = 'appointments') {
    const subscribeStart = new Date().getTime();

    const payload = {
      topic: `realtime:${channel}`,
      event: 'phx_join',
      payload: {
        config: {
          broadcast: {
            self: true,
          },
          presence: {
            key: this.userId,
          },
        },
      },
      ref: this.messageCount++,
    };

    this.send(JSON.stringify(payload));
    messagesSent.add(1);

    const subscribeTime = new Date().getTime() - subscribeStart;
    subscribeDuration.add(subscribeTime);

    console.log(`[${this.userId}] Subscribed to ${channel} channel`);
  }

  /**
   * Simula envio de mensagem
   */
  simulateUpdate(data) {
    const payload = {
      topic: `realtime:appointments`,
      event: 'new_event',
      payload: {
        ...data,
        sentAt: new Date().getTime(),
      },
      ref: this.messageCount++,
    };

    this.send(JSON.stringify(payload));
    messagesSent.add(1);
  }

  /**
   * Fecha conexão
   */
  close() {
    if (this.socket) {
      this.socket.close();
      this.connected = false;
    }
  }

  /**
   * Aguarda conexão estar pronta
   */
  waitForConnection(timeout = 5000) {
    const start = new Date().getTime();
    while (!this.connected && (new Date().getTime() - start) < timeout) {
      sleep(0.1);
    }
    return this.connected;
  }

  /**
   * Aguarda subscription estar pronta
   */
  waitForSubscription(timeout = 5000) {
    const start = new Date().getTime();
    while (!this.subscribed && (new Date().getTime() - start) < timeout) {
      sleep(0.1);
    }
    return this.subscribed;
  }
}

// ============================================================================
// SETUP
// ============================================================================

export function setup() {
  console.log(`\n========================================`);
  console.log(`BarberZap Load Testing - Realtime/WebSocket`);
  console.log(`========================================`);
  console.log(`WS URL: ${WS_URL}`);
  console.log(`Scenario: ${SCENARIO}`);
  console.log(`Starting tests at: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  return {
    startTime: new Date().toISOString(),
  };
}

// ============================================================================
// TEARDOWN
// ============================================================================

export function teardown(data) {
  console.log(`\n========================================`);
  console.log(`Realtime Test Summary`);
  console.log(`========================================`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Duration: ${Math.round((new Date() - new Date(data.startTime)) / 1000)}s`);
  console.log(`Successful connections: ${successfulConnections.count}`);
  console.log(`Failed connections: ${failedConnections.count}`);
  console.log(`Messages sent: ${messagesSent.count}`);
  console.log(`Messages received: ${messagesReceived.count}`);
  console.log(`Disconnections: ${disconnections.count}`);
  console.log(`========================================\n`);
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

export default function main() {
  const user = randomItem(testUsers);
  const ws = new WebSocketConnection(user.userId, user.shopId);

  // Passo 1: Conectar ao WebSocket
  const connected = ws.connect();

  if (!check(ws, {
    'WebSocket connected': (w) => w.waitForConnection(5000),
  })) {
    console.error(`[${user.userId}] Failed to connect`);
    ws.close();
    sleep(1);
    return;
  }

  sleep(0.5);

  // Passo 2: Subscrever em um canal
  const channel = randomItem(channels);
  ws.subscribeToChannel(channel);

  if (!check(ws, {
    'WebSocket subscribed': (w) => w.waitForSubscription(5000),
  })) {
    console.warn(`[${user.userId}] Failed to subscribe`);
  }

  sleep(0.5);

  // Passo 3: Simular troca de mensagens
  const actions = Math.floor(Math.random() * 10) + 5; // 5-15 ações

  for (let i = 0; i < actions; i++) {
    // Simular delay aleatório entre mensagens
    sleep(Math.random() * 0.5 + 0.2);

    // Ações possíveis
    const actionType = Math.random();

    if (actionType < 0.4) {
      // 40%: Enviar heartbeat
      ws.sendHeartbeat();
    } else if (actionType < 0.7) {
      // 30%: Simular atualização de agendamento
      ws.simulateUpdate({
        type: 'appointment_update',
        shopId: user.shopId,
        userId: user.userId,
        timestamp: new Date().toISOString(),
      });
    } else if (actionType < 0.85) {
      // 15%: Enviar heartbeat
      ws.sendHeartbeat();
    } else {
      // 15%: Verificar conexão está ativa
      check(ws, {
        'WebSocket still connected': (w) => w.connected,
        'WebSocket still subscribed': (w) => w.subscribed,
      });
    }
  }

  // Validar no final
  const finalCheck = check(ws, {
    'WebSocket still connected at end': (w) => w.connected,
    'Received messages': (w) => w.messages.length > 0,
    'Connection duration acceptable': (w) => {
      // Verificar se conexão durou tempo suficiente sem desconexões
      return ws.reconnectAttempts === 0;
    },
  });

  // Passo 4: Fechar conexão
  ws.close();

  sleep(Math.random() * 0.3);
}
