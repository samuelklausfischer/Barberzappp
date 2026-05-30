/**
 * BarberZap - Load Testing: Redis Cache
 * Testa operações de cache com diferentes níveis de concorrência
 * 
 * Métricas alvo:
 * - p50: <1ms
 * - p95: <5ms
 * - Hit rate: >80%
 * - Availability: 99.9%
 * 
 * Uso:
 * k6 run --env REDIS_URL=http://localhost:6379 tests/load/load-redis.test.js
 * k6 run --env REDIS_URL=http://localhost:6379 --env SCENARIO=baseline tests/load/load-redis.test.js
 * k6 run --env REDIS_URL=http://localhost:6379 --env SCENARIO=stress tests/load/load-redis.test.js
 * 
 * NOTA: Este teste usa HTTP APIs para Redis. Se tiver Redis direto via TCP,
 * você pode usar xk6-redis ou adaptar para usar o protocolo REDIS.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// ============================================================================
// CONFIGURAÇÃO DE AMBIENTE
// ============================================================================

const REDIS_URL = __ENV.REDIS_URL || 'http://localhost:6379';
const REDIS_API_URL = __ENV.REDIS_API_URL || 'http://localhost:8080'; // Alternative: use redis-http server
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USE_API = __ENV.USE_API || 'true'; // Use API instead of direct Redis
const SCENARIO = __ENV.SCENARIO || 'concurrent_100';

// ============================================================================
// MÉTRICAS CUSTOMIZADAS
// ============================================================================

const cacheErrorRate = new Rate('cache_errors');
const cacheHitRate = new Gauge('cache_hit_rate');

const getDuration = new Trend('cache_get_duration');
const setDuration = new Trend('cache_set_duration');
const invalidateDuration = new Trend('cache_invalidate_duration');
const deleteDuration = new Trend('cache_delete_duration');

const cacheHits = new Counter('cache_hits');
const cacheMisses = new Counter('cache_misses');
const cacheSets = new Counter('cache_sets');
const cacheInvalidations = new Counter('cache_invalidations');
const cacheDeletes = new Counter('cache_deletes');

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
    concurrent_100: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
    },
    concurrent_500: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 500 },
        { duration: '5m', target: 500 },
        { duration: '2m', target: 100 },
      ],
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 100,
      stages: [
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '3m', target: 1000 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    // Performance targets para cache (extremamente rápidos)
    'cache_get_duration': [
      'p(50)<1',   // 50% dos GETs em <1ms
      'p(95)<5',   // 95% dos GETs em <5ms
      'p(99)<10',  // 99% dos GETs em <10ms
    ],
    'cache_set_duration': [
      'p(95)<10',
      'p(99)<20',
    ],
    'cache_errors': ['rate<0.001'],
    'cache_hit_rate': ['value>0.8'], // >80% hit rate
  },
};

const selectedScenario = SCENARIO in options.scenarios ? SCENARIO : 'concurrent_100';
options.scenarios = { [selectedScenario]: options.scenarios[selectedScenario] };

// ============================================================================
// DADOS DE TESTE
// ============================================================================

const cacheKeys = Array.from({ length: 1000 }, (_, i) => `cache_key_${i + 1}`);

const cacheDataTypes = [
  'appointments',
  'clients',
  'services',
  'revenue',
  'slots',
  'notifications',
];

const testData = {
  simple: 'simple_value',
  json: JSON.stringify({ id: 1, name: 'Test', value: 123 }),
  array: JSON.stringify([1, 2, 3, 4, 5]),
  nested: JSON.stringify({
    user: { id: 1, name: 'Test' },
    appointments: [
      { id: 1, date: '2026-03-04', status: 'confirmed' },
      { id: 2, date: '2026-03-05', status: 'pending' },
    ],
  }),
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getCacheKey() {
  const prefix = randomItem(cacheDataTypes);
  const suffix = Math.floor(Math.random() * 1000);
  return `${prefix}:${suffix}`;
}

/**
 * GET operation - Busca valor do cache
 */
function cacheGet(key, expectedValue = null) {
  const startTime = new Date().getTime();
  let res;

  if (USE_API === 'true') {
    // Use HTTP API para Redis
    res = http.get(`${REDIS_API_URL}/get/${key}`, {
      tags: { name: 'GET' },
    });
  } else {
    // Use API base do BarberZap que internamente usa Redis
    res = http.get(`${BASE_URL}/api/cache/${key}`, {
      tags: { name: 'GET' },
    });
  }

  const duration = new Date().getTime() - startTime;
  getDuration.add(duration);

  // Verificar se foi hit ou miss
  let isHit = false;

  if (res.status === 200 && res.json('value') !== undefined) {
    isHit = true;
    cacheHits.add(1);

    // Validar valor se fornecido
    if (expectedValue !== null) {
      check(res, {
        'cache get returns expected value': (r) => r.json('value') === expectedValue,
      });
    }
  } else if (res.status === 404) {
    cacheMisses.add(1);
    isHit = false;
  } else if (res.status === 200 && res.json('value') === null) {
    cacheMisses.add(1);
    isHit = false;
  } else {
    cacheErrorRate.add(1);
  }

  check(res, {
    'cache get returns 2xx or 404': (r) => r.status === 200 || r.status === 404,
    'cache get response time <10ms': (r) => r.timings.duration < 10,
  });

  return {
    success: res.status === 200 || res.status === 404,
    hit: isHit,
    value: res.json('value'),
    duration,
  };
}

/**
 * SET operation - Define valor no cache
 */
function cacheSet(key, value, ttl = 300) {
  const startTime = new Date().getTime();
  let res;

  const payload = JSON.stringify({
    key,
    value,
    ttl,
  });

  if (USE_API === 'true') {
    res = http.post(`${REDIS_API_URL}/set`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'SET' },
    });
  } else {
    res = http.post(`${BASE_URL}/api/cache`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'SET' },
    });
  }

  const duration = new Date().getTime() - startTime;
  setDuration.add(duration);

  const success = res.status === 200 || res.status === 201;

  if (success) {
    cacheSets.add(1);
  } else {
    cacheErrorRate.add(1);
  }

  check(res, {
    'cache set returns 2xx': (r) => success,
    'cache set response time <20ms': (r) => r.timings.duration < 20,
  });

  return {
    success,
    duration,
  };
}

/**
 * DELETE operation - Remove valor do cache
 */
function cacheDelete(key) {
  const startTime = new Date().getTime();
  let res;

  if (USE_API === 'true') {
    res = http.del(`${REDIS_API_URL}/keys/${key}`, {
      tags: { name: 'DELETE' },
    });
  } else {
    res = http.del(`${BASE_URL}/api/cache/${key}`, {
      tags: { name: 'DELETE' },
    });
  }

  const duration = new Date().getTime() - startTime;
  deleteDuration.add(duration);

  const success = res.status === 200 || res.status === 204;

  if (success) {
    cacheDeletes.add(1);
  } else {
    cacheErrorRate.add(1);
  }

  check(res, {
    'cache delete returns 2xx': (r) => success,
    'cache delete response time <10ms': (r) => r.timings.duration < 10,
  });

  return {
    success,
    duration,
  };
}

/**
 * INVALIDATE operation - Invalida múltiplas chaves por padrão
 */
function cacheInvalidate(pattern) {
  const startTime = new Date().getTime();
  let res;

  if (USE_API === 'true') {
    res = http.del(`${REDIS_API_URL}/keys?pattern=${pattern}`, {
      tags: { name: 'INVALIDATE' },
    });
  } else {
    res = http.post(`${BASE_URL}/api/cache/invalidate`, JSON.stringify({ pattern }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'INVALIDATE' },
    });
  }

  const duration = new Date().getTime() - startTime;
  invalidateDuration.add(duration);

  const success = res.status === 200 || res.status === 204;

  if (success) {
    cacheInvalidations.add(1);
  } else {
    cacheErrorRate.add(1);
  }

  check(res, {
    'cache invalidate returns 2xx': (r) => success,
    'cache invalidate response time <20ms': (r) => r.timings.duration < 20,
  });

  return {
    success,
    duration,
  };
}

/**
 * MGET operation - Busca múltiplos valores (bulk)
 */
function cacheMGet(keys) {
  const startTime = new Date().getTime();
  let res;

  if (USE_API === 'true') {
    res = http.post(
      `${REDIS_API_URL}/mget`,
      JSON.stringify({ keys }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'MGET' },
      }
    );
  } else {
    res = http.post(
      `${BASE_URL}/api/cache/bulk`,
      JSON.stringify({ keys, operation: 'get' }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'MGET' },
      }
    );
  }

  const duration = new Date().getTime() - startTime;
  getDuration.add(duration);

  const success = res.status === 200;

  if (success) {
    // Count hits
    const values = res.json('values') || [];
    const hits = values.filter(v => v !== null).length;
    cacheHits.add(hits);
    cacheMisses.add(values.length - hits);
  } else {
    cacheErrorRate.add(1);
  }

  check(res, {
    'cache mget returns 2xx': (r) => success,
  });

  return {
    success,
    duration,
    values: res.json('values'),
  };
}

/**
 * MSET operation - Define múltiplos valores (bulk)
 */
function cacheMSet(items) {
  const startTime = new Date().getTime();
  let res;

  const payload = JSON.stringify({ items });

  if (USE_API === 'true') {
    res = http.post(`${REDIS_API_URL}/mset`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'MSET' },
    });
  } else {
    res = http.post(`${BASE_URL}/api/cache/bulk`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'MSET' },
    });
  }

  const duration = new Date().getTime() - startTime;
  setDuration.add(duration);

  const success = res.status === 200;

  if (success) {
    cacheSets.add(items.length);
  } else {
    cacheErrorRate.add(1);
  }

  check(res, {
    'cache mset returns 2xx': (r) => success,
  });

  return {
    success,
    duration,
  };
}

// ============================================================================
// SETUP
// ============================================================================

export function setup() {
  console.log(`\n========================================`);
  console.log(`BarberZap Load Testing - Redis Cache`);
  console.log(`========================================`);
  console.log(`Redis URL: ${REDIS_URL}`);
  console.log(`Redis API URL: ${REDIS_API_URL}`);
  console.log(`Use API: ${USE_API}`);
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
  const totalHits = cacheHits.count;
  const totalMisses = cacheMisses.count;
  const totalGets = totalHits + totalMisses;
  const hitRate = totalGets > 0 ? (totalHits / totalGets) * 100 : 0;

  // Atualizar gauge
  cacheHitRate.add(hitRate / 100);

  console.log(`\n========================================`);
  console.log(`Cache Test Summary`);
  console.log(`========================================`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Duration: ${Math.round((new Date() - new Date(data.startTime)) / 1000)}s`);
  console.log(`Cache hits: ${totalHits}`);
  console.log(`Cache misses: ${totalMisses}`);
  console.log(`Hit rate: ${hitRate.toFixed(2)}%`);
  console.log(`Cache sets: ${cacheSets.count}`);
  console.log(`Cache invalidations: ${cacheInvalidations.count}`);
  console.log(`Cache deletes: ${cacheDeletes.count}`);
  console.log(`Errors: ${(cacheErrors.count * 100).toFixed(2)}%`);
  console.log(`========================================\n`);
}

// ============================================================================
// MAIN TEST FLOW
// ============================================================================

export default function main() {
  // Passo 1: SET - Adicionar valor ao cache (80% das vezes)
  if (Math.random() < 0.8) {
    const key = getCacheKey();
    const value = randomItem(Object.values(testData));
    const ttl = Math.floor(Math.random() * 300) + 60; // 1-5 minutos

    cacheSet(key, value, ttl);
    sleep(Math.random() * 0.01); // Pequena pausa
  }

  // Passo 2: GET - Buscar valor do cache
  if (Math.random() < 0.9) {
    // 90% das vezes, buscar uma chave existente (alta probabilidade de hit)
    const key = `appointments:${Math.floor(Math.random() * 100)}`;
    const getResult = cacheGet(key);

    if (!getResult.hit) {
      // Se miss, setar o valor para próximo hit
      cacheSet(key, randomItem(Object.values(testData)));
    }

    sleep(Math.random() * 0.01);
  }

  // Passo 3: MGET - Bulk get (20% das vezes)
  if (Math.random() < 0.2) {
    const keys = Array.from({ length: 10 }, () => 
      getCacheKey()
    );
    cacheMGet(keys);
    sleep(Math.random() * 0.01);
  }

  // Passo 4: MSET - Bulk set (10% das vezes)
  if (Math.random() < 0.1) {
    const items = Array.from({ length: 5 }, () => ({
      key: getCacheKey(),
      value: randomItem(Object.values(testData)),
    }));
    cacheMSet(items);
    sleep(Math.random() * 0.01);
  }

  // Passo 5: DELETE - Remover valor (5% das vezes)
  if (Math.random() < 0.05) {
    const key = getCacheKey();
    cacheDelete(key);
    sleep(Math.random() * 0.01);
  }

  // Passo 6: INVALIDATE - Invalidar por padrão (3% das vezes)
  if (Math.random() < 0.03) {
    const pattern = randomItem(cacheDataTypes) + ':*';
    cacheInvalidate(pattern);
    sleep(Math.random() * 0.01);
  }

  // Verificar hit rate a cada 10 iterações aproximadamente
  // (usando timestamp para não ser sempre)
  if (Math.random() < 0.001) {
    const totalHits = cacheHits.count;
    const totalMisses = cacheMisses.count;
    const totalGets = totalHits + totalMisses;
    const hitRate = totalGets > 0 ? (totalHits / totalGets) : 0;
    cacheHitRate.add(hitRate);
  }
}
