/**
 * BarberZap - Load Testing: Booking Flow
 * Testa o fluxo completo de reserva com diferentes níveis de concorrência
 * 
 * Métricas alvo:
 * - p50: <200ms
 * - p95: <500ms
 * - p99: <800ms
 * - Availability: 99.5%
 * 
 * Uso:
 * k6 run --env BASE_URL=http://localhost:3000 tests/load/load-booking.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=baseline tests/load/load-booking.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=concurrent_10 tests/load/load-booking.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=stress tests/load/load-booking.test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || `${BASE_URL}/api`;
const SCENARIO = __ENV.SCENARIO || 'concurrent_10';

// ============================================================================
// MÉTRICAS CUSTOMIZADAS
// ============================================================================

// Taxa de erros (deve ser <1%)
const errorRate = new Rate('booking_errors');

// Latência por endpoint
const loginDuration = new Trend('booking_login_duration');
const fetchSlotsDuration = new Trend('booking_fetch_slots_duration');
const bookDuration = new Trend('booking_book_duration');
const verifyDuration = new Trend('booking_verify_duration');

// Contadores
const successfulBookings = new Counter('booking_successful');
const failedBookings = new Counter('booking_failed');

// ============================================================================
// CONFIGURAÇÃO DE CENÁRIOS
// ============================================================================

export const options = {
  scenarios: {
    baseline: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 10,
      maxDuration: '10m',
    },
    concurrent_10: {
      executor: 'constant-arrival-rate',
      rate: 10,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVus: 20,
      maxVUs: 50,
    },
    concurrent_50: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVus: 50,
      maxVUs: 100,
    },
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVus: 100,
      maxVUs: 200,
      stages: [
        { duration: '5m', target: 10 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 10 },
      ],
    },
  },
  thresholds: {
    // Performance targets
    'http_req_duration': [
      'p(50)<200',  // 50% das requisições devem ser <200ms
      'p(95)<500',  // 95% das requisições devem ser <500ms
      'p(99)<800',  // 99% das requisições devem ser <800ms
    ],
    // Error rate target
    'http_req_failed': ['rate<0.01'],  // Menos de 1% de falhas
    'booking_errors': ['rate<0.01'],   // Menos de 1% de erros
    // Booking-specific thresholds
    'booking_login_duration': [
      'p(95)<300',
      'p(99)<500',
    ],
    'booking_book_duration': [
      'p(95)<600',
      'p(99)<1000',
    ],
  },
};

// Selecionar cenário baseado na variável de ambiente
const selectedScenario = SCENARIO in options.scenarios ? SCENARIO : 'concurrent_10';
options.scenarios = { [selectedScenario]: options.scenarios[selectedScenario] };

// ============================================================================
// DADOS DE TESTE
// ============================================================================

// Lista de usuários de teste (shop owners)
const shopOwners = [
  { email: 'shop1@barber.test', password: 'Test123!@#', shopId: 'shop_001' },
  { email: 'shop2@barber.test', password: 'Test123!@#', shopId: 'shop_002' },
  { email: 'shop3@barber.test', password: 'Test123!@#', shopId: 'shop_003' },
  { email: 'shop4@barber.test', password: 'Test123!@#', shopId: 'shop_004' },
  { email: 'shop5@barber.test', password: 'Test123!@#', shopId: 'shop_005' },
];

// Clientes de teste
const testClients = Array.from({ length: 100 }, (_, i) => ({
  id: `client_${i + 1}`,
  name: `Test Client ${i + 1}`,
  email: `client${i + 1}@test.com`,
  phone: `551199999${String(i).padStart(4, '0')}`,
}));

// Serviços disponíveis
const services = [
  { id: 'srv_001', name: 'Corte de Cabelo', duration: 30, price: 50 },
  { id: 'srv_002', name: 'Barba', duration: 20, price: 30 },
  { id: 'srv_003', name: 'Combo Cabelo + Barba', duration: 45, price: 70 },
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Seleciona um item aleatório de um array
 */
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gera um timestamp para amanhã
 */
function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

/**
 * Gera um horário aleatório válido
 */
function randomTime() {
  const hours = Math.floor(Math.random() * 10) + 9; // 9h às 18h
  const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Realiza login e retorna accessToken
 */
function login() {
  const owner = randomItem(shopOwners);
  
  const payload = JSON.stringify({
    email: owner.email,
    password: owner.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      name: 'Login',
    },
  };

  const res = http.post(`${API_URL}/auth/login`, payload, params);
  loginDuration.add(res.timings.duration);

  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns access token': (r) => r.json('accessToken') !== undefined,
    'login returns user info': (r) => r.json('user') !== undefined,
  });

  errorRate.add(!success);

  if (success) {
    return {
      accessToken: res.json('accessToken'),
      userId: res.json('user.id'),
      shopId: owner.shopId,
    };
  }

  return null;
}

/**
 * Busca horários disponíveis
 */
function fetchAvailableSlots(auth, date) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'AvailableSlots',
    },
  };

  const res = http.get(
    `${API_URL}/shops/${auth.shopId}/slots?date=${date}`,
    params
  );
  fetchSlotsDuration.add(res.timings.duration);

  const success = check(res, {
    'fetch slots status is 200': (r) => r.status === 200,
    'fetch slots returns array': (r) => Array.isArray(r.json()),
  });

  errorRate.add(!success);

  if (success) {
    return res.json();
  }

  return [];
}

/**
 * Cria uma reserva
 */
function bookAppointment(auth, appointmentData) {
  const payload = JSON.stringify(appointmentData);

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'BookAppointment',
    },
  };

  const res = http.post(`${API_URL}/appointments`, payload, params);
  bookDuration.add(res.timings.duration);

  const success = check(res, {
    'book status is 201': (r) => r.status === 201,
    'book returns appointment id': (r) => r.json('id') !== undefined,
    'book returns status confirmed': (r) => r.json('status') === 'confirmed',
  });

  errorRate.add(!success);

  if (success) {
    successfulBookings.add(1);
    return res.json('id');
  } else {
    failedBookings.add(1);
    return null;
  }
}

/**
 * Verifica se a reserva foi criada
 */
function verifyBooking(auth, bookingId) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'VerifyBooking',
    },
  };

  const res = http.get(`${API_URL}/appointments/${bookingId}`, params);
  verifyDuration.add(res.timings.duration);

  const success = check(res, {
    'verify status is 200': (r) => r.status === 200,
    'verify booking exists': (r) => r.json('id') === bookingId,
    'verify booking is confirmed': (r) => r.json('status') === 'confirmed',
  });

  errorRate.add(!success);

  return success;
}

/**
 * Cancela uma reserva (cleanup)
 */
function cancelBooking(auth, bookingId) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
  };

  const res = http.del(`${API_URL}/appointments/${bookingId}`, params);

  return res.status === 204;
}

// ============================================================================
// SETUP
// ============================================================================

export function setup() {
  console.log(`\n========================================`);
  console.log(`BarberZap Load Testing - Booking Flow`);
  console.log(`========================================`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Scenario: ${SCENARIO}`);
  console.log(`Starting tests at: ${new Date().toISOString()}`);
  console.log(`========================================\n`);

  // Aqui você pode criar dados de teste necessários
  // como usuários, barbearias, etc.
  
  return {
    startTime: new Date().toISOString(),
  };
}

// ============================================================================
// TEARDOWN
// ============================================================================

export function teardown(data) {
  console.log(`\n========================================`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Duration: ${Math.round((new Date() - new Date(data.startTime)) / 1000)}s`);
  console.log(`Successful bookings: ${successfulBookings.count}`);
  console.log(`Failed bookings: ${failedBookings.count}`);
  console.log========================================\n`);
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

export default function main() {
  // Passo 1: Login como shop owner
  const auth = login();
  
  if (!auth) {
    console.error('Falha no login. Abortando iteração.');
    sleep(1);
    return;
  }

  // Pequena pausa simulando tempo entre ações
  sleep(Math.random() * 2 + 1);

  // Passo 2: Buscar horários disponíveis
  const date = getTomorrowDate();
  const slots = fetchAvailableSlots(auth, date);

  if (!slots || slots.length === 0) {
    console.warn('Nenhum slot disponível. Continuando...');
    sleep(1);
    return;
  }

  sleep(Math.random() * 1 + 0.5);

  // Passo 3: Selecionar um slot aleatório e criar reserva
  const selectedSlot = randomItem(slots);
  const service = randomItem(services);
  const client = randomItem(testClients);

  const appointmentData = {
    shopId: auth.shopId,
    clientId: client.id,
    serviceId: service.id,
    date: date,
    time: selectedSlot.time,
    duration: service.duration,
    price: service.price,
    status: 'confirmed',
  };

  const bookingId = bookAppointment(auth, appointmentData);

  if (!bookingId) {
    console.error('Falha ao criar reserva.');
    sleep(1);
    return;
  }

  sleep(Math.random() * 1 + 0.5);

  // Passo 4: Verificar se a reserva foi criada com sucesso
  const verified = verifyBooking(auth, bookingId);

  if (!verified) {
    console.error('Falha ao verificar reserva.');
    return;
  }

  // Passo 5: Cleanup (cancelar a reserva para não poluir o banco)
  if (Math.random() > 0.5) {
    // 50% de chance de cancelar para manter banco limpo
    cancelBooking(auth, bookingId);
  }

  sleep(Math.random() * 2 + 1);
}
