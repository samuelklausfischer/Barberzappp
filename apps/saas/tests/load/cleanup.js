/**
 * BarberZap Load Testing - Cleanup Script
 * Remove dados de teste criados durante os testes de carga
 * 
 * IMPORTANT: Tome cuidado ao executar em produção!
 * 
 * Uso:
 * k6 run --env CLEANUP_MODE=true tests/load/cleanup.js
 */

import http from 'k6/http';
import { check } from 'k6';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || `${BASE_URL}/api`;
const DRY_RUN = __ENV.DRY_RUN || 'false'; // true não deleta nada

// ============================================================================
// FUNÇÕES
// ============================================================================

function getToken(email, password) {
  const payload = JSON.stringify({ email, password });
  const res = http.post(`${API_URL}/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status === 200) {
    return {
      accessToken: res.json('accessToken'),
      userId: res.json('user.id'),
    };
  }

  return null;
}

function cleanupTestAppointments(auth, shopId) {
  const page = 1;
  const limit = 100;
  let totalDeleted = 0;

  console.log(`\nCleaning up appointments for shop ${shopId}...`);

  while (true) {
    const res = http.get(
      `${API_URL}/shops/${shopId}/appointments?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.accessToken}`,
        },
      }
    );

    if (res.status !== 200 || !Array.isArray(res.json())) {
      break;
    }

    const appointments = res.json();
    
    if (appointments.length === 0) {
      break;
    }

    for (const appointment of appointments) {
      // Deletar apenas agendamentos de teste
      if (isTestData(appointment)) {
        if (DRY_RUN === 'true') {
          console.log(`[DRY RUN] Would delete appointment ${appointment.id}`);
        } else {
          const delRes = http.del(
            `${API_URL}/appointments/${appointment.id}`,
            null,
            {
              headers: {
                'Authorization': `Bearer ${auth.accessToken}`,
              },
            }
          );

          if (delRes.status === 204) {
            totalDeleted++;
          }
        }
      }
    }

    if (appointments.length < limit) {
      break;
    }

    sleep(0.1);
  }

  console.log(`✓ Deleted ${totalDeleted} test appointments`);
  return totalDeleted;
}

function cleanupTestClients(auth, shopId) {
  const page = 1;
  const limit = 100;
  let totalDeleted = 0;

  console.log(`\nCleaning up clients for shop ${shopId}...`);

  while (true) {
    const res = http.get(
      `${API_URL}/shops/${shopId}/clients?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.accessToken}`,
        },
      }
    );

    if (res.status !== 200 || !Array.isArray(res.json())) {
      break;
    }

    const clients = res.json();
    
    if (clients.length === 0) {
      break;
    }

    for (const client of clients) {
      // Deletar apenas clientes de teste
      if (isTestData(client)) {
        if (DRY_RUN === 'true') {
          console.log(`[DRY RUN] Would delete client ${client.id}`);
        } else {
          const delRes = http.del(
            `${API_URL}/clients/${client.id}`,
            null,
            {
              headers: {
                'Authorization': `Bearer ${auth.accessToken}`,
              },
            }
          );

          if (delRes.status === 204) {
            totalDeleted++;
          }
        }
      }
    }

    if (clients.length < limit) {
      break;
    }

    sleep(0.1);
  }

  console.log(`✓ Deleted ${totalDeleted} test clients`);
  return totalDeleted;
}

function cleanupTestSlots(auth, shopId) {
  console.log(`\nCleaning up slots for shop ${shopId}...`);

  if (DRY_RUN === 'true') {
    console.log(`[DRY RUN] Would delete slots for shop ${shopId}`);
    return 0;
  }

  const res = http.del(
    `${API_URL}/shops/${shopId}/slots`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${auth.accessToken}`,
      },
    }
  );

  if (res.status === 204) {
    console.log(`✓ Deleted all slots for shop ${shopId}`);
    return 1;
  }

  return 0;
}

function clearCache() {
  console.log('\nClearing cache...');

  if (DRY_RUN === 'true') {
    console.log('[DRY RUN] Would clear cache');
    return true;
  }

  const patterns = [
    'appointments:*',
    'services:*',
    'clients:*',
    'slots:*',
    'revenue:*',
    'dashboard:*',
  ];

  for (const pattern of patterns) {
    const res = http.post(
      `${API_URL}/cache/invalidate`,
      JSON.stringify({ pattern }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (res.status === 200 || res.status === 204) {
      console.log(`✓ Cleared cache pattern: ${pattern}`);
    }
  }

  return true;
}

function isTestData(data) {
  // Verifica se é dado de teste baseado em padrões
  if (!data) return false;

  // Email patterns
  if (data.email && (
    data.email.includes('@barber.test') ||
    data.email.includes('@test.com') ||
    data.email.startsWith('client')
  )) {
    return true;
  }

  // Name patterns
  if (data.name && (
    data.name.includes('Test') ||
    data.name.startsWith('Test Client')
  )) {
    return true;
  }

  // ID patterns
  if (data.id && data.id.startsWith('client_')) {
    return true;
  }

  // Notes/Description patterns
  if (data.notes && data.notes.includes('load testing')) {
    return true;
  }

  return false;
}

function cleanupShop(shopOwner) {
  console.log(`\nCleaning up shop for ${shopOwner.email}...`);

  const auth = getToken(shopOwner.email, shopOwner.password);
  
  if (!auth) {
    console.error(`✗ Failed to login as ${shopOwner.email}`);
    return {
      appointments: 0,
      clients: 0,
      slots: 0,
    };
  }

  // Buscar shops do usuário
  const shopsRes = http.get(`${API_URL}/shops`, {
    headers: {
      'Authorization': `Bearer ${auth.accessToken}`,
    },
  });

  if (shopsRes.status !== 200 || !Array.isArray(shopsRes.json())) {
    console.error('✗ Failed to fetch shops');
    return { appointments: 0, clients: 0, slots: 0 };
  }

  const results = {
    appointments: 0,
    clients: 0,
    slots: 0,
  };

  for (const shop of shopsRes.json()) {
    results.appointments += cleanupTestAppointments(auth, shop.id);
    results.clients += cleanupTestClients(auth, shop.id);
    results.slots += cleanupTestSlots(auth, shop.id);
  }

  return results;
}

function cleanupAll() {
  const testUsers = [
    { email: 'shop1@barber.test', password: 'Test123!@#' },
    { email: 'shop2@barber.test', password: 'Test123!@#' },
    { email: 'shop3@barber.test', password: 'Test123!@#' },
    { email: 'shop4@barber.test', password: 'Test123!@#' },
    { email: 'shop5@barber.test', password: 'Test123!@#' },
  ];

  let totalAppointments = 0;
  let totalClients = 0;
  let totalSlots = 0;

  for (const user of testUsers) {
    const results = cleanupShop(user);
    totalAppointments += results.appointments;
    totalClients += results.clients;
    totalSlots += results.slots;
  }

  // Limpar cache
  clearCache();

  return {
    appointments: totalAppointments,
    clients: totalClients,
    slots: totalSlots,
  };
}

// ============================================================================
// MAIN CLEANUP
// ============================================================================

export default function main() {
  console.log('\n========================================');
  console.log('BarberZap Load Testing - Cleanup');
  console.log('========================================');
  console.log(`DRY RUN: ${DRY_RUN}`);
  console.log(`Mode: ${DRY_RUN === 'true' ? 'Simulation (no data will be deleted)' : 'Live (data will be deleted)'}`);
  console.log('========================================\n');

  if (DRY_RUN !== 'true') {
    // Confirm cleanup em modo live
    console.log('⚠️  WARNING: This will DELETE test data!');
    console.log('⚠️  Press Ctrl+C to cancel');
    console.log('');
    console.log('Proceeding in 5 seconds...');
    sleep(5);
  }

  const results = cleanupAll();

  console.log('\n========================================');
  console.log('Cleanup Summary');
  console.log('========================================');
  console.log(`Appointments deleted: ${results.appointments}`);
  console.log(`Clients deleted: ${results.clients}`);
  console.log(`Slots cleared: ${results.slots}`);
  console.log('Cache cleared: ✓');
  console.log('========================================\n');
}

// k6 configuration
export const options = {
  vus: 1,
  iterations: 1,
  duration: '10m',
};
