/**
 * BarberZap - Load Testing: Dashboard API
 * Testa endpoints do dashboard com diferentes níveis de concorrência
 * 
 * Métricas alvo:
 * - p50: <100ms
 * - p95: <200ms
 * - p99: <400ms
 * - Availability: 99.9%
 * 
 * Uso:
 * k6 run --env BASE_URL=http://localhost:3000 tests/load/load-dashboard.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=baseline tests/load/load-dashboard.test.js
 * k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=stress tests/load/load-dashboard.test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || `${BASE_URL}/api`;
const SCENARIO = __ENV.SCENARIO || 'concurrent_25';

// ============================================================================
// MÉTRICAS CUSTOMIZADAS
// ============================================================================

// Taxa de erros (deve ser <0.1%)
const errorRate = new Rate('dashboard_errors');

// Latência por endpoint
const appointmentsTodayDuration = new Trend('dash_appointments_today_duration');
const appointmentsWeekDuration = new Trend('dash_appointments_week_duration');
const appointmentsMonthDuration = new Trend('dash_appointments_month_duration');
const clientsListDuration = new Trend('dash_clients_list_duration');
const revenueStatsDuration = new Trend('dash_revenue_stats_duration');
const dashboardOverviewDuration = new Trend('dash_overview_duration');

// Contadores
const successfulRequests = new Counter('dash_successful_requests');
const failedRequests = new Counter('dash_failed_requests');

// ============================================================================
// CONFIGURAÇÃO DE CENÁRIOS
// ============================================================================

export const options = {
  scenarios: {
    baseline: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 20,
      maxDuration: '10m',
    },
    concurrent_25: {
      executor: 'constant-arrival-rate',
      rate: 25,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVus: 30,
      maxVUs: 75,
    },
    concurrent_50: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '10m',
      preAllocatedVus: 60,
      maxVUs: 150,
    },
    stress: {
      executor: 'ramping-arrival-rate',
      startRate: 25,
      timeUnit: '1s',
      preAllocatedVus: 100,
      maxVUs: 250,
      stages: [
        { duration: '5m', target: 25 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 150 },
        { duration: '5m', target: 50 },
        { duration: '5m', target: 25 },
      ],
    },
  },
  thresholds: {
    // Performance targets mais agressivos para dashboard
    'http_req_duration': [
      'p(50)<100',  // 50% das requisições devem ser <100ms
      'p(95)<200',  // 95% das requisições devem ser <200ms
      'p(99)<400',  // 99% das requisições devem ser <400ms
    ],
    // Error rate target (mais rigoroso para dashboard)
    'http_req_failed': ['rate<0.001'],  // Menos de 0.1% de falhas
    'dashboard_errors': ['rate<0.001'],  // Menos de 0.1% de erros
    // Dashboard-specific thresholds
    'dash_appointments_today_duration': [
      'p(95)<150',
      'p(99)<250',
    ],
    'dash_clients_list_duration': [
      'p(95)<200',
      'p(99)<350',
    ],
    'dash_revenue_stats_duration': [
      'p(95)<150',
      'p(99)<250',
    ],
    'dash_overview_duration': [
      'p(95)<200',
      'p(99)<350',
    ],
  },
};

const selectedScenario = SCENARIO in options.scenarios ? SCENARIO : 'concurrent_25';
options.scenarios = { [selectedScenario]: options.scenarios[selectedScenario] };

// ============================================================================
// DADOS DE TESTE
// ============================================================================

const shopOwners = [
  { email: 'shop1@barber.test', password: 'Test123!@#', shopId: 'shop_001' },
  { email: 'shop2@barber.test', password: 'Test123!@#', shopId: 'shop_002' },
  { email: 'shop3@barber.test', password: 'Test123!@#', shopId: 'shop_003' },
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
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
      name: 'DashboardLogin',
    },
  };

  const res = http.post(`${API_URL}/auth/login`, payload, params);

  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login returns access token': (r) => r.json('accessToken') !== undefined,
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
 * Busca agendamentos de hoje
 */
function fetchAppointments(auth, period = 'today') {
  let url = `${API_URL}/shops/${auth.shopId}/appointments`;
  
  if (period === 'today') {
    url += `?date=${getTodayDate()}`;
  } else if (period === 'week') {
    const range = getWeekRange();
    url += `?from=${range.start}&to=${range.end}`;
  } else if (period === 'month') {
    const now = new Date();
    url += `?year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
  }

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'Appointments',
    },
  };

  const res = http.get(url, params);

  // Registrar métrica específica
  if (period === 'today') {
    appointmentsTodayDuration.add(res.timings.duration);
  } else if (period === 'week') {
    appointmentsWeekDuration.add(res.timings.duration);
  } else {
    appointmentsMonthDuration.add(res.timings.duration);
  }

  const success = check(res, {
    'appointments status is 200': (r) => r.status === 200,
    'appointments returns array': (r) => Array.isArray(r.json()),
  });

  errorRate.add(!success);

  if (success) {
    successfulRequests.add(1);
    return res.json();
  } else {
    failedRequests.add(1);
    return [];
  }
}

/**
 * Busca lista de clientes
 */
function fetchClients(auth) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'ClientsList',
    },
  };

  const res = http.get(`${API_URL}/shops/${auth.shopId}/clients`, params);
  clientsListDuration.add(res.timings.duration);

  const success = check(res, {
    'clients status is 200': (r) => r.status === 200,
    'clients returns array': (r) => Array.isArray(r.json()),
    'clients has pagination': (r) => r.json('pagination') !== undefined,
  });

  errorRate.add(!success);

  if (success) {
    successfulRequests.add(1);
    return res.json();
  } else {
    failedRequests.add(1);
    return [];
  }
}

/**
 * Busca estatísticas de receita
 */
function fetchRevenueStats(auth, period = 'today') {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'RevenueStats',
    },
  };

  const res = http.get(`${API_URL}/shops/${auth.shopId}/revenue?period=${period}`, params);
  revenueStatsDuration.add(res.timings.duration);

  const success = check(res, {
    'revenue status is 200': (r) => r.status === 200,
    'revenue returns total': (r) => r.json('total') !== undefined,
    'revenue returns count': (r) => r.json('count') !== undefined,
  });

  errorRate.add(!success);

  if (success) {
    successfulRequests.add(1);
    return res.json();
  } else {
    failedRequests.add(1);
    return null;
  }
}

/**
 * Busca visão geral do dashboard
 */
function fetchDashboardOverview(auth) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'DashboardOverview',
    },
  };

  const res = http.get(`${API_URL}/shops/${auth.shopId}/dashboard`, params);
  dashboardOverviewDuration.add(res.timings.duration);

  const success = check(res, {
    'overview status is 200': (r) => r.status === 200,
    'overview returns appointments today': (r) => r.json('appointmentsToday') !== undefined,
    'overview returns revenue today': (r) => r.json('revenueToday') !== undefined,
    'overview returns pending requests': (r) => r.json('pendingRequests') !== undefined,
  });

  errorRate.add(!success);

  if (success) {
    // Verificar performance extra
    check(res, {
      'overview response <200ms': (r) => r.timings.duration < 200,
      'overview response <100ms': (r) => r.timings.duration < 100,
    });

    successfulRequests.add(1);
    return res.json();
  } else {
    failedRequests.add(1);
    return null;
  }
}

/**
 * Navega para diferentes páginas do dashboard
 */
function navigateDashboardPages(auth) {
  const pages = [
    'overview',
    'calendar',
    'clients',
    'services',
    'reports',
  ];

  const page = randomItem(pages);

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    tags: {
      name: 'PageNavigation',
    },
  };

  const res = http.get(`${API_URL}/shops/${auth.shopId}/pages/${page}`, params);

  const success = check(res, {
    'page navigation status is 200': (r) => r.status === 200,
    'page returns content': (r) => r.status === 200,
  });

  errorRate.add(!success);

  if (success) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }
}

// ============================================================================
// SETUP
// ============================================================================

export function setup() {
  console.log(`\n========================================`);
  console.log(`BarberZap Load Testing - Dashboard API`);
  console.log(`========================================`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}`);
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
  console.log(`Dashboard Test Summary`);
  console.log(`========================================`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Duration: ${Math.round((new Date() - new Date(data.startTime)) / 1000)}s`);
  console.log(`Successful requests: ${successfulRequests.count}`);
  console.log(`Failed requests: ${failedRequests.count}`);
  console.log(`Error rate: ${((failedRequests.count / (successfulRequests.count + failedRequests.count)) * 100).toFixed(2)}%`);
  console.log(`========================================\n`);
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

export default function main() {
  // Passo 1: Login
  const auth = login();
  
  if (!auth) {
    console.error('Falha no login. Abortando iteração.');
    sleep(1);
    return;
  }

  sleep(Math.random() * 0.5 + 0.2);

  // Passo 2: Buscar visão geral do dashboard
  const overview = fetchDashboardOverview(auth);
  
  if (!overview) {
    console.warn('Falha ao buscar overview. Continuando...');
  }

  sleep(Math.random() * 0.3 + 0.2);

  // Passo 3: Buscar agendamentos de hoje
  const appointmentsToday = fetchAppointments(auth, 'today');

  sleep(Math.random() * 0.3 + 0.2);

  // Passo 4: Buscar agendamentos da semana (30% das vezes)
  if (Math.random() < 0.3) {
    const appointmentsWeek = fetchAppointments(auth, 'week');
    sleep(Math.random() * 0.3 + 0.2);
  }

  // Passo 5: Buscar lista de clientes (50% das vezes)
  if (Math.random() < 0.5) {
    const clients = fetchClients(auth);
    sleep(Math.random() * 0.3 + 0.2);
  }

  // Passo 6: Buscar estatísticas de receita
  const periods = ['today', 'week', 'month'];
  const period = randomItem(periods);
  const revenue = fetchRevenueStats(auth, period);

  sleep(Math.random() * 0.3 + 0.2);

  // Passo 7: Navegar para uma página aleatória do dashboard
  navigateDashboardPages(auth);

  // Pausa simulando tempo de visualização
  sleep(Math.random() * 2 + 1);
}
