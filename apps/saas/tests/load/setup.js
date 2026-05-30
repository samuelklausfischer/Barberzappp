/**
 * BarberZap Load Testing - Setup Script
 * Cria dados de teste necessários para os testes de carga
 * 
 * Uso:
 * node tests/load/setup.js
 * k6 run --env SETUP_MODE=true tests/load/setup.js
 */

import http from 'k6/http';
import { check } from 'k6';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || `${BASE_URL}/api`;

// ============================================================================
// DADOS PARA CRIAÇÃO
// ============================================================================

const shopOwners = [
  { 
    email: 'shop1@barber.test', 
    password: 'Test123!@#',
    name: 'Barbearia Teste 1',
    phone: '5511999990001',
    address: 'Rua Teste, 001',
  },
  { 
    email: 'shop2@barber.test', 
    password: 'Test123!@#',
    name: 'Barbearia Teste 2',
    phone: '5511999990002',
    address: 'Rua Teste, 002',
  },
  { 
    email: 'shop3@barber.test', 
    password: 'Test123!@#',
    name: 'Barbearia Teste 3',
    phone: '5511999990003',
    address: 'Rua Teste, 003',
  },
  { 
    email: 'shop4@barber.test', 
    password: 'Test123!@#',
    name: 'Barbearia Teste 4',
    phone: '5511999990004',
    address: 'Rua Teste, 004',
  },
  { 
    email: 'shop5@barber.test', 
    password: 'Test123!@#',
    name: 'Barbearia Teste 5',
    phone: '5511999990005',
    address: 'Rua Teste, 005',
  },
];

const services = [
  { name: 'Corte de Cabelo', duration: 30, price: 50 },
  { name: 'Barba', duration: 20, price: 30 },
  { name: 'Combo Cabelo + Barba', duration: 45, price: 70 },
  { name: 'Corte Infantil', duration: 25, price: 40 },
  { name: 'Hidratação', duration: 30, price: 60 },
];

// ============================================================================
// FUNÇÕES
// ============================================================================

function createUser(user) {
  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
    name: user.name,
    phone: user.phone,
    role: 'shop_owner',
  });

  const res = http.post(`${API_URL}/auth/register`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 201 || res.status === 409) {
    // 201 = Created, 409 = Already exists
    console.log(`✓ User ${user.email} ready`);
    return { ...user, id: res.json('id') };
  } else {
    console.error(`✗ Failed to create user ${user.email}: ${res.status}`);
    return null;
  }
}

function createShop(shopData, userId) {
  const payload = JSON.stringify({
    ...shopData,
    ownerId: userId,
  });

  const res = http.post(`${API_URL}/shops`, payload, {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken(userId, shopData.email, shopData.password)}`,
    },
  });

  if (res.status === 201) {
    console.log(`✓ Shop ${shopData.name} created`);
    return res.json();
  } else if (res.status === 409) {
    console.log(`✓ Shop ${shopData.name} already exists`);
    return res.json();
  } else {
    console.error(`✗ Failed to create shop: ${res.status}`);
    return null;
  }
}

function getToken(userId, email, password) {
  const payload = JSON.stringify({ email, password });
  const res = http.post(`${API_URL}/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  return res.json('accessToken') || '';
}

function createServices(shopId, accessToken) {
  const created = [];

  for (const service of services) {
    const payload = JSON.stringify({
      ...service,
      shopId,
    });

    const res = http.post(`${API_URL}/shops/${shopId}/services`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (res.status === 201) {
      created.push(res.json());
    } else if (res.status === 409) {
      // Service already exists
      created.push(res.json());
    }
  }

  console.log(`✓ ${created.length} services created for shop ${shopId}`);
  return created;
}

function generateSlots(shopId, accessToken, days = 7) {
  const slots = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Gerar slots das 9h às 18h
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute of [0, 15, 30, 45]) {
        slots.push({
          shopId,
          date: dateStr,
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          available: true,
        });
      }
    }
  }

  // Enviar em batch
  const payload = JSON.stringify({ slots });
  const res = http.post(`${API_URL}/shops/${shopId}/slots/batch`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  console.log(`✓ ${slots.length} slots generated for shop ${shopId}`);
  return slots;
}

function generateTestClients(count = 100) {
  const created = [];

  for (let i = 0; i < count; i++) {
    const client = {
      id: `client_${i + 1}`,
      name: `Test Client ${i + 1}`,
      email: `client${i + 1}@test.com`,
      phone: `551199999${String(i).padStart(4, '0')}`,
      notes: 'Load testing client',
    };

    created.push(client);
  }

  console.log(`✓ ${count} test clients defined`);
  return created;
}

function preloadCache(shopIds) {
  for (const shopId of shopIds) {
    // Carregar agendamentos em cache
    http.get(`${BASE_URL}/api/shops/${shopId}/appointments?preload=true`);

    // Carregar clientes em cache
    http.get(`${BASE_URL}/api/shops/${shopId}/clients?preload=true`);

    // Carregar slots em cache
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    http.get(`${BASE_URL}/api/shops/${shopId}/slots?date=${dateStr}&preload=true`);

    console.log(`✓ Cache preloaded for shop ${shopId}`);
  }
}

// ============================================================================
// MAIN SETUP
// ============================================================================

export default function setup() {
  console.log('\n========================================');
  console.log('BarberZap Load Testing - Setup');
  console.log('========================================\n');

  const results = {
    users: [],
    shops: [],
    clients: [],
  };

  // Criar usuários (shop owners)
  console.log('Creating shop owners...');
  for (const userData of shopOwners) {
    const user = createUser(userData);
    if (user) {
      results.users.push(user);
    }
  }

  // Criar barbearias
  console.log('\nCreating shops...');
  for (const user of results.users) {
    const shop = createShop(user, user.id);
    if (shop) {
        results.shops.push(shop);
    }
  }

  // Criar serviços para cada barbearia
  console.log('\nCreating services...');
  for (const shop of results.shops) {
    const user = results.users.find(u => u.id === shop.ownerId);
    if (user) {
      const token = getToken(user.id, user.email, user.password);
      createServices(shop.id, token);
      generateSlots(shop.id, token, 7);
    }
  }

  // Gerar clientes de teste
  console.log('\nGenerating test clients...');
  results.clients = generateTestClients(100);

  // Carregar cache
  console.log('\nPreloading cache...');
  const shopIds = results.shops.map(s => s.id);
  preloadCache(shopIds);

  console.log('\n========================================');
  console.log('Setup completed!');
  console.log(`Users: ${results.users.length}`);
  console.log(`Shops: ${results.shops.length}`);
  console.log(`Clients: ${results.clients.length}`);
  console.log('========================================\n');

  return results;
}

// k6 doesn't support direct execution, so this is for reference
// To run: k6 run tests/load/setup.js

export const options = {
  vus: 1,
  iterations: 1,
  duration: '10m',
};
