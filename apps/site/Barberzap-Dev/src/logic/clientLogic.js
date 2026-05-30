/**
 * Client Logic
 * 
 * Business logic for managing barbershop clients.
 * Handles CRUD operations, validation, status management, and duplicate checking.
 */

import { v4 as uuidv4 } from 'uuid';

// Mock data for demo purposes
const MOCK_CLIENTS = [
  {
    id: 'client-001',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '+55 11 98765-4321',
    birthdate: '1990-05-15',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      cep: '01310-100'
    },
    notes: 'Prefere cabelo curto, usa gel estilo pomada. Frequenta há 2 anos.',
    status: 'active',
    totalAppointments: 24,
    totalSpent: 1920.00,
    averageVisitValue: 80.00,
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-002',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    phone: '+55 11 97654-3210',
    birthdate: '1985-08-22',
    address: {
      street: 'Rua Augusta',
      number: '500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      cep: '01304-000'
    },
    notes: 'Cliente VIP, sempre agenda com antecedência.',
    status: 'active',
    totalAppointments: 36,
    totalSpent: 2880.00,
    averageVisitValue: 80.00,
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1095 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-003',
    name: 'Pedro Oliveira',
    email: 'pedro.oliveira@email.com',
    phone: '+55 11 96543-2109',
    birthdate: '1995-02-10',
    address: {
      street: 'Rua Oscar Freire',
      number: '250',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      cep: '01426-000'
    },
    notes: '',
    status: 'inactive',
    totalAppointments: 8,
    totalSpent: 640.00,
    averageVisitValue: 80.00,
    lastVisit: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-004',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '+55 11 95432-1098',
    birthdate: '1992-11-30',
    address: {
      street: 'Av. Brasil',
      number: '1500',
      neighborhood: 'Jardim América',
      city: 'São Paulo',
      state: 'SP',
      cep: '01430-001'
    },
    notes: 'Primeira vez, indicada por João Silva.',
    status: 'pending',
    totalAppointments: 0,
    totalSpent: 0.00,
    averageVisitValue: 0.00,
    lastVisit: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'client-005',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@email.com',
    phone: '+55 11 94321-0987',
    birthdate: '1988-07-08',
    address: {
      street: 'Rua Haddock Lobo',
      number: '800',
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      cep: '01414-001'
    },
    notes: 'Barbearia preferida. Gosta de conversar durante o corte.',
    status: 'active',
    totalAppointments: 45,
    totalSpent: 3600.00,
    averageVisitValue: 80.00,
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1460 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock appointment history data
const MOCK_APPOINTMENTS = [
  {
    id: 'apt-001',
    clientId: 'client-001',
    clientName: 'João Silva',
    service: 'Corte Masculino',
    barber: 'Marcos',
    price: 80.00,
    status: 'completed',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Deixou nas laterais 3mm, topo 5cm'
  },
  {
    id: 'apt-002',
    clientId: 'client-001',
    clientName: 'João Silva',
    service: 'Barba',
    barber: 'Marcos',
    price: 40.00,
    status: 'completed',
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    notes: ''
  },
  {
    id: 'apt-003',
    clientId: 'client-002',
    clientName: 'Maria Santos',
    service: 'Corte + Barba',
    barber: 'Ricardo',
    price: 120.00,
    status: 'completed',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Cliente VIP'
  },
  {
    id: 'apt-004',
    clientId: 'client-003',
    clientName: 'Pedro Oliveira',
    service: 'Corte Masculino',
    barber: 'Marcos',
    price: 80.00,
    status: 'completed',
    date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Última visita antes de ficar inativo'
  }
];

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(n => n.length > 0)
    .map(n => n[0].toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Format phone number to Brazilian format
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a Brazilian number (starts with 55 and has 13 digits)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const countryCode = '+55';
    const ddd = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 9);
    const secondPart = cleaned.slice(9);
    return `${countryCode} ${ddd} ${firstPart}-${secondPart}`;
  }
  
  // If it's already formatted, return as is
  if (phone.includes('+55')) return phone;
  
  // Try to format as Brazilian number
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2);
    const firstPart = cleaned.slice(2, 7);
    const secondPart = cleaned.slice(7);
    return `+55 ${ddd} ${firstPart}-${secondPart}`;
  }
  
  return phone;
};

/**
 * Format currency to BRL
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Format date to Brazilian format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

/**
 * Format date relative to now (e.g., "há 2 dias")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays < 7) return `há ${diffInDays} dias`;
  if (diffInDays < 30) return `há ${Math.floor(diffInDays / 7)} semanas`;
  if (diffInDays < 365) return `há ${Math.floor(diffInDays / 30)} meses`;
  return `há ${Math.floor(diffInDays / 365)} anos`;
};

/**
 * Determine client status based on last visit
 */
export const calculateClientStatus = (client) => {
  if (!client.lastVisit) {
    return client.totalAppointments > 0 ? 'inactive' : 'pending';
  }
  
  const lastVisit = new Date(client.lastVisit);
  const now = new Date();
  const diffInDays = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
  
  if (diffInDays <= 90) return 'active';
  if (diffInDays <= 180) return 'inactive';
  return 'archived';
};

/**
 * Status badge configuration
 */
export const STATUS_COLORS = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inactive: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  pending: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  archived: 'bg-gray-500/15 text-gray-400 border-gray-500/30'
};

export const STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo',
  pending: 'Pendente',
  archived: 'Arquivado'
};

/**
 * Client Service
 */
class ClientService {
  constructor() {
    this.clients = [...MOCK_CLIENTS];
    this.appointments = [...MOCK_APPOINTMENTS];
  }

  /**
   * Get all clients
   */
  async getClients(filters = {}) {
    let filtered = [...this.clients];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(client => 
        new Date(client.createdAt) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(client => 
        new Date(client.createdAt) <= new Date(filters.dateTo)
      );
    }

    return filtered;
  }

  /**
   * Get client by ID
   */
  async getClientById(id) {
    return this.clients.find(client => client.id === id) || null;
  }

  /**
   * Create new client
   */
  async createClient(clientData) {
    // Validate required fields
    if (!clientData.name || !clientData.phone) {
      throw new Error('Nome e telefone são obrigatórios');
    }

    // Check for duplicates
    const duplicateEmail = this.clients.find(c => 
      c.email && c.email.toLowerCase() === clientData.email?.toLowerCase()
    );
    if (duplicateEmail) {
      throw new Error('Já existe um cliente com este e-mail');
    }

    const duplicatePhone = this.clients.find(c => 
      c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, '')
    );
    if (duplicatePhone) {
      throw new Error('Já existe um cliente com este telefone');
    }

    const newClient = {
      id: `client-${uuidv4()}`,
      name: clientData.name.trim(),
      email: clientData.email?.trim() || '',
      phone: formatPhone(clientData.phone),
      birthdate: clientData.birthdate || null,
      address: clientData.address || {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        cep: ''
      },
      notes: clientData.notes || '',
      status: clientData.status || 'pending',
      totalAppointments: 0,
      totalSpent: 0,
      averageVisitValue: 0,
      lastVisit: null,
      createdAt: new Date().toISOString()
    };

    this.clients.push(newClient);
    return newClient;
  }

  /**
   * Update existing client
   */
  async updateClient(id, clientData) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente não encontrado');
    }

    // Check for duplicates (excluding current client)
    if (clientData.email) {
      const duplicateEmail = this.clients.find(c => 
        c.id !== id && c.email && c.email.toLowerCase() === clientData.email.toLowerCase()
      );
      if (duplicateEmail) {
        throw new Error('Já existe outro cliente com este e-mail');
      }
    }

    if (clientData.phone) {
      const duplicatePhone = this.clients.find(c => 
        c.id !== id && c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, '')
      );
      if (duplicatePhone) {
        throw new Error('Já existe outro cliente com este telefone');
      }
    }

    this.clients[index] = {
      ...this.clients[index],
      name: clientData.name.trim(),
      email: clientData.email?.trim() || '',
      phone: formatPhone(clientData.phone),
      birthdate: clientData.birthdate || null,
      address: clientData.address || this.clients[index].address,
      notes: clientData.notes || '',
      status: clientData.status || this.clients[index].status
    };

    return this.clients[index];
  }

  /**
   * Delete client
   */
  async deleteClient(id) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente não encontrado');
    }

    const deleted = this.clients.splice(index, 1)[0];
    return deleted;
  }

  /**
   * Archive client (soft delete)
   */
  async archiveClient(id) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente não encontrado');
    }

    this.clients[index].status = 'archived';
    return this.clients[index];
  }

  /**
   * Restore archived client
   */
  async restoreClient(id) {
    const index = this.clients.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Cliente não encontrado');
    }

    const client = this.clients[index];
    client.status = calculateClientStatus(client);
    return client;
  }

  /**
   * Get client statistics
   */
  async getStats() {
    const total = this.clients.length;
    const active = this.clients.filter(c => c.status === 'active').length;
    const inactive = this.clients.filter(c => c.status === 'inactive').length;
    const pending = this.clients.filter(c => c.status === 'pending').length;
    const archived = this.clients.filter(c => c.status === 'archived').length;

    const totalRevenue = this.clients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgTicket = total > 0 ? totalRevenue / total : 0;

    return {
      total,
      active,
      inactive,
      pending,
      archived,
      totalRevenue,
      avgTicket
    };
  }

  /**
   * Get client appointment history
   */
  async getClientHistory(clientId) {
    return this.appointments
      .filter(apt => apt.clientId === clientId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Update client metrics after appointment
   */
  async updateClientMetrics(clientId, appointment) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    if (appointment.status === 'completed') {
      client.totalAppointments += 1;
      client.totalSpent += appointment.price;
      client.averageVisitValue = client.totalSpent / client.totalAppointments;
      client.lastVisit = appointment.date;
      client.status = 'active';
    }
  }

  /**
   * Export clients to CSV
   */
  async exportToCSV(clientIds = null) {
    let clientsToExport = this.clients;

    if (clientIds && clientIds.length > 0) {
      clientsToExport = this.clients.filter(c => clientIds.includes(c.id));
    }

    const headers = [
      'ID',
      'Nome',
      'Email',
      'Telefone',
      'Status',
      'Total Agendamentos',
      'Total Gasto',
      'Última Visita',
      'Data Cadastro'
    ];

    const rows = clientsToExport.map(client => [
      client.id,
      client.name,
      client.email,
      client.phone,
      client.status,
      client.totalAppointments,
      client.totalSpent.toFixed(2),
      client.lastVisit || '',
      client.createdAt
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Send WhatsApp message to client
   */
  async sendWhatsAppMessage(clientId, message) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    // Format phone for WhatsApp link
    const phone = client.phone.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return {
      success: true,
      whatsappLink
    };
  }
}

// Export singleton instance
export const clientService = new ClientService();

// Export utilities
export default clientService;
