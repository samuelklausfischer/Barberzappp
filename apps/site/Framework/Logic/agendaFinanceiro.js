/**
 * BarberZap Agenda & Financeiro Logic
 * 
 * Business logic for appointment scheduling and revenue tracking
 */

// ============================================================================
// DATA STRUCTURES
// ============================================================================

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT: 'credit',
  DEBIT: 'debit',
  PIX: 'pix',
  PENDING: 'pending'
};

export const APPOINTMENT_STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/15 text-yellow-400', icon: '⏳' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/15 text-emerald-400', icon: '✓' },
  completed: { label: 'Concluído', color: 'bg-blue-500/15 text-blue-400', icon: '✓' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/15 text-red-400', icon: '✕' },
  'no-show': { label: 'Não Compareceu', color: 'bg-orange-500/15 text-orange-400', icon: '✕' }
};

export const PAYMENT_METHOD_CONFIG = {
  cash: { label: 'Dinheiro', color: 'bg-green-500/15 text-green-400', icon: '💵' },
  credit: { label: 'Crédito', color: 'bg-blue-500/15 text-blue-400', icon: '💳' },
  debit: { label: 'Débito', color: 'bg-purple-500/15 text-purple-400', icon: '💳' },
  pix: { label: 'PIX', color: 'bg-teal-500/15 text-teal-400', icon: '📱' },
  pending: { label: 'Pendente', color: 'bg-gray-500/15 text-gray-400', icon: '⏳' }
};

// Mock data services
const MOCK_SERVICES = [
  { id: '1', name: 'Corte Masculino', price: 35, duration: 30, category: 'corte' },
  { id: '2', name: 'Barba', price: 25, duration: 20, category: 'barba' },
  { id: '3', name: 'Corte + Barba', price: 50, duration: 50, category: 'combo' },
  { id: '4', name: 'Hidratação', price: 30, duration: 30, category: 'cuidados' },
  { id: '5', name: 'Pigmentação Sobrancelha', price: 45, duration: 40, category: 'pigmentação' },
  { id: '6', name: 'Corte Criança', price: 25, duration: 25, category: 'corte' },
  { id: '7', name: 'Sobrancelha', price: 15, duration: 15, category: 'barba' },
  { id: '8', name: 'Coloração', price: 80, duration: 60, category: 'cuidados' }
];

const MOCK_BARBERS = [
  { id: '1', name: 'Carlos Silva', commission: 30, avatar: 'CS' },
  { id: '2', name: ' João Santos', commission: 25, avatar: 'JS' },
  { id: '3', name: 'Pedro Oliveira', commission: 30, avatar: 'PO' },
  { id: '4', name: 'Lucas Ferreira', commission: 25, avatar: 'LF' }
];

const MOCK_CLIENTS = [
  { id: '1', name: 'Ricardo Almeida', phone: '+55 11 98765-4321', email: 'ricardo@email.com' },
  { id: '2', name: 'Bruno Costa', phone: '+55 11 91234-5678', email: 'bruno@email.com' },
  { id: '3', name: 'Diego Mendes', phone: '+55 11 99876-5432', email: 'diego@email.com' },
  { id: '4', name: 'Gabriel Souza', phone: '+55 11 97654-3210', email: 'gabriel@email.com' },
  { id: '5', name: 'Felipe Nunes', phone: '+55 11 96543-2109', email: 'felipe@email.com' }
];

// ============================================================================
// STORAGE
// ============================================================================

const STORAGE_KEY_APPOINTMENTS = 'barberzap_appointments';
const STORAGE_KEY_TRANSACTIONS = 'barberzap_transactions';
const STORAGE_KEY_BUSINESS_HOURS = 'barberzap_business_hours';

const STORAGE = {
  get: (key, defaultValue = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage error:', error);
    }
  }
};

// Default business hours
const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '09:00', close: '18:00', enabled: true },
  tuesday: { open: '09:00', close: '18:00', enabled: true },
  wednesday: { open: '09:00', close: '18:00', enabled: true },
  thursday: { open: '09:00', close: '18:00', enabled: true },
  friday: { open: '09:00', close: '18:00', enabled: true },
  saturday: { open: '09:00', close: '16:00', enabled: true },
  sunday: { open: '09:00', close: '14:00', enabled: false }
};

// ============================================================================
// APPOINTMENT SERVICE
// ============================================================================

const appointmentService = {
  /**
   * Get all appointments with optional filtering
   */
  getAppointments: (filters = {}) => {
    let appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);

    // Apply filters
    if (filters.status) {
      appointments = appointments.filter(a => a.status === filters.status);
    }
    if (filters.barberId) {
      appointments = appointments.filter(a => a.barberId === filters.barberId);
    }
    if (filters.clientId) {
      appointments = appointments.filter(a => a.clientId === filters.clientId);
    }
    if (filters.date) {
      appointments = appointments.filter(a => a.date === filters.date);
    }
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      appointments = appointments.filter(a => a.date >= start && a.date <= end);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      appointments = appointments.filter(a => {
        const client = MOCK_CLIENTS.find(c => c.id === a.clientId);
        return client?.name.toLowerCase().includes(query);
      });
    }

    // Sort by date and time
    return appointments.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  },

  /**
   * Get appointment by ID
   */
  getAppointmentById: (id) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    return appointments.find(a => a.id === id);
  },

  /**
   * Create new appointment
   */
  createAppointment: async (data) => {
    // Check for double booking
    const isAvailable = appointmentService.checkAvailability(
      data.barberId,
      data.date,
      data.time,
      data.duration
    );

    if (!isAvailable) {
      throw new Error('Horário indisponível. Já existe agendamento para este barbeiro neste horário.');
    }

    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    const newAppointment = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: data.clientId,
      serviceId: data.serviceId,
      barberId: data.barberId,
      date: data.date,
      time: data.time,
      duration: data.duration,
      price: data.price,
      status: data.status || APPOINTMENT_STATUS.PENDING,
      paymentMethod: data.paymentMethod || PAYMENT_METHODS.PENDING,
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    appointments.push(newAppointment);
    STORAGE.set(STORAGE_KEY_APPOINTMENTS, appointments);

    return newAppointment;
  },

  /**
   * Update appointment
   */
  updateAppointment: async (id, updates) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    const index = appointments.findIndex(a => a.id === id);

    if (index === -1) {
      throw new Error('Agendamento não encontrado');
    }

    // If changing time/barber, check availability
    if (updates.barberId || updates.date || updates.time || updates.duration) {
      const barberId = updates.barberId || appointments[index].barberId;
      const date = updates.date || appointments[index].date;
      const time = updates.time || appointments[index].time;
      const duration = updates.duration || appointments[index].duration;

      const isAvailable = appointmentService.checkAvailability(
        barberId,
        date,
        time,
        duration,
        id // Exclude current appointment from check
      );

      if (!isAvailable) {
        throw new Error('Horário indisponível');
      }
    }

    appointments[index] = { ...appointments[index], ...updates };
    STORAGE.set(STORAGE_KEY_APPOINTMENTS, appointments);

    return appointments[index];
  },

  /**
   * Delete appointment
   */
  deleteAppointment: (id) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    const filtered = appointments.filter(a => a.id !== id);
    STORAGE.set(STORAGE_KEY_APPOINTMENTS, filtered);
  },

  /**
   * Check if barber is available at given time
   */
  checkAvailability: (barberId, date, time, duration, excludeId = null) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    
    // Get appointment end time
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = hours * 60 + minutes;
    const endTime = startTime + duration;

    // Check for conflicting appointments
    const conflicts = appointments.filter(apt => {
      if (apt.id === excludeId) return false;
      if (apt.barberId !== barberId) return false;
      if (apt.date !== date) return false;
      if (apt.status === APPOINTMENT_STATUS.CANCELLED || apt.status === APPOINTMENT_STATUS.NO_SHOW) return false;

      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      const aptStartTime = aptHours * 60 + aptMinutes;
      const aptEndTime = aptStartTime + apt.duration;

      // Check for overlap
      return (startTime < aptEndTime && endTime > aptStartTime);
    });

    return conflicts.length === 0;
  },

  /**
   * Get available time slots for a barber on a specific date
   */
  getAvailableSlots: (barberId, date, serviceDuration = 30) => {
    const businessHours = appointmentService.getBusinessHours(date);
    if (!businessHours) return [];

    const { open, close } = businessHours;
    const [openHours, openMinutes] = open.split(':').map(Number);
    const [closeHours, closeMinutes] = close.split(':').map(Number);

    const dayStart = openHours * 60 + openMinutes;
    const dayEnd = closeHours * 60 + closeMinutes;
    const slotInterval = 30; // 30-minute slots

    const slots = [];
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);

    for (let time = dayStart; time + serviceDuration <= dayEnd; time += slotInterval) {
      const slotHours = Math.floor(time / 60).toString().padStart(2, '0');
      const slotMinutes = (time % 60).toString().padStart(2, '0');
      const slotTime = `${slotHours}:${slotMinutes}`;

      const isAvailable = appointmentService.checkAvailability(
        barberId,
        date,
        slotTime,
        serviceDuration
      );

      if (isAvailable) {
        slots.push({
          time: slotTime,
          label: slotTime,
          available: true
        });
      }
    }

    return slots;
  },

  /**
   * Get appointments for a specific date (for calendar)
   */
  getAppointmentsByDate: (date) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    return appointments
      .filter(a => a.date === date && a.status !== APPOINTMENT_STATUS.CANCELLED)
      .map(apt => {
        const client = MOCK_CLIENTS.find(c => c.id === apt.clientId);
        const service = MOCK_SERVICES.find(s => s.id === apt.serviceId);
        const barber = MOCK_BARBERS.find(b => b.id === apt.barberId);

        return {
          ...apt,
          clientName: client?.name || 'Cliente não encontrado',
          clientPhone: client?.phone || '',
          serviceName: service?.name || 'Serviço não encontrado',
          barberName: barber?.name || 'Barbeiro não encontrado'
        };
      });
  },

  /**
   * Get appointments for a date range (for calendar month view)
   */
  getAppointmentsByMonth: (year, month) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    const monthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;

    return appointments
      .filter(a => a.date.startsWith(monthPrefix) && a.status !== APPOINTMENT_STATUS.CANCELLED)
      .map(apt => {
        const client = MOCK_CLIENTS.find(c => c.id === apt.clientId);
        const service = MOCK_SERVICES.find(s => s.id === apt.serviceId);
        const barber = MOCK_BARBERS.find(b => b.id === apt.barberId);

        return {
          ...apt,
          clientName: client?.name || 'Cliente',
          serviceName: service?.name || 'Serviço',
          barberName: barber?.name || 'Barbeiro'
        };
      });
  },

  /**
   * Get appointment statistics
   */
  getAppointmentStats: () => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    const today = new Date().toISOString().split('T')[0];

    // Get start of week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + 1); // Monday
    const weekStartDate = weekStart.toISOString().split('T')[0];
    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekStart.getDate() + 6);
    const weekEndDateStr = weekEndDate.toISOString().split('T')[0];

    const todayAppointments = appointments.filter(a => a.date === today);
    const weekAppointments = appointments.filter(a => a.date >= weekStartDate && a.date <= weekEndDateStr);
    const cancelledAppointments = appointments.filter(a => a.status === APPOINTMENT_STATUS.CANCELLED || a.status === APPOINTMENT_STATUS.NO_SHOW);
    const completedAppointments = appointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED);

    // Calculate average duration
    let totalDuration = 0;
    completedAppointments.forEach(apt => totalDuration += apt.duration);
    const avgDuration = completedAppointments.length > 0 ? Math.round(totalDuration / completedAppointments.length) : 0;

    // Calculate cancellation rate
    const cancellationRate = appointments.length > 0 
      ? Math.round((cancelledAppointments.length / appointments.length) * 100) 
      : 0;

    return {
      today: todayAppointments.length,
      thisWeek: weekAppointments.length,
      total: appointments.length,
      cancelled: cancelledAppointments.length,
      completed: completedAppointments.length,
      cancellationRate,
      averageDuration: avgDuration
    };
  },

  /**
   * Get business hours for a specific date
   */
  getBusinessHours: (date) => {
    const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const businessHours = STORAGE.get(STORAGE_KEY_BUSINESS_HOURS, DEFAULT_BUSINESS_HOURS);
    const dayConfig = businessHours[dayMap[dayOfWeek]];

    return dayConfig?.enabled ? { open: dayConfig.open, close: dayConfig.close } : null;
  }
};

// ============================================================================
// FINANCEIRO SERVICE
// ============================================================================

const financeiroService = {
  /**
   * Get all transactions (derived from completed appointments)
   */
  getTransactions: (filters = {}) => {
    const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS, []);
    
    // Only include completed or confirmed appointments with payment
    let transactions = appointments
      .filter(apt => 
        apt.status === APPOINTMENT_STATUS.COMPLETED || 
        apt.status === APPOINTMENT_STATUS.CONFIRMED
      )
      .map(apt => {
        const client = MOCK_CLIENTS.find(c => c.id === apt.clientId);
        const service = MOCK_SERVICES.find(s => s.id === apt.serviceId);
        const barber = MOCK_BARBERS.find(b => b.id === apt.barberId);

        return {
          id: apt.id,
          date: apt.date,
          time: apt.time,
          clientName: client?.name || 'Cliente não encontrado',
          clientId: apt.clientId,
          serviceName: service?.name || 'Serviço não encontrado',
          serviceCategory: service?.category || 'outros',
          barberName: barber?.name || 'Barbeiro não encontrado',
          barberId: apt.barberId,
          amount: apt.price,
          paymentMethod: apt.paymentMethod,
          status: apt.paymentMethod === PAYMENT_METHODS.PENDING ? 'pending' : 'paid',
          createdAt: apt.createdAt
        };
      });

    // Apply filters
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      transactions = transactions.filter(t => t.date >= start && t.date <= end);
    }
    if (filters.barberId) {
      transactions = transactions.filter(t => t.barberId === filters.barberId);
    }
    if (filters.paymentMethod) {
      transactions = transactions.filter(t => t.paymentMethod === filters.paymentMethod);
    }
    if (filters.status) {
      transactions = transactions.filter(t => t.status === filters.status);
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      transactions = transactions.filter(t => 
        t.clientName.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    return transactions.sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * Get financial statistics
   */
  getFinancialStats: () => {
    const transactions = financeiroService.getTransactions();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthPrefix = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;

    // Today's revenue
    const todayTransactions = transactions.filter(t => t.date === today && t.paymentMethod !== PAYMENT_METHODS.PENDING);
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Month revenue
    const monthTransactions = transactions.filter(t => 
      t.date.startsWith(monthPrefix) && t.paymentMethod !== PAYMENT_METHODS.PENDING
    );
    const monthRevenue = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Total transactions (completed appointments)
    const totalTransactions = transactions.filter(t => t.paymentMethod !== PAYMENT_METHODS.PENDING);
    const totalRevenue = totalTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Average ticket
    const avgTicket = totalTransactions.length > 0 
      ? totalRevenue / totalTransactions.length 
      : 0;

    // Payment method breakdown
    const paymentBreakdown = {
      cash: { count: 0, amount: 0 },
      credit: { count: 0, amount: 0 },
      debit: { count: 0, amount: 0 },
      pix: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 }
    };

    transactions.forEach(t => {
      const method = t.paymentMethod in paymentBreakdown ? t.paymentMethod : 'pending';
      paymentBreakdown[method].count++;
      if (t.paymentMethod !== PAYMENT_METHODS.PENDING) {
        paymentBreakdown[method].amount += t.amount;
      }
    });

    // Revenue by service category
    const revenueByCategory = {};
    monthTransactions.forEach(t => {
      const category = t.serviceCategory || 'outros';
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = { count: 0, amount: 0 };
      }
      revenueByCategory[category].count++;
      if (t.paymentMethod !== PAYMENT_METHODS.PENDING) {
        revenueByCategory[category].amount += t.amount;
      }
    });

    // Revenue by barber (commission calculation)
    const revenueByBarber = {};
    monthTransactions.forEach(t => {
      if (!revenueByBarber[t.barberId]) {
        const barber = MOCK_BARBERS.find(b => b.id === t.barberId);
        revenueByBarber[t.barberId] = {
          name: barber?.name || 'Barbeiro',
          commission: barber?.commission || 0,
          amount: 0,
          appointments: 0
        };
      }
      revenueByBarber[t.barberId].appointments++;
      if (t.paymentMethod !== PAYMENT_METHODS.PENDING) {
        revenueByBarber[t.barberId].amount += t.amount;
      }
    });

    return {
      todayRevenue,
      monthRevenue,
      totalRevenue,
      totalAppointments: totalTransactions.length,
      monthAppointments: monthTransactions.length,
      averageTicket: avgTicket,
      paymentBreakdown,
      revenueByCategory,
      revenueByBarber
    };
  },

  /**
   * Get revenue data for charts (last 7 days)
   */
  getRevenueChart7Days: () => {
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });

      const transactions = financeiroService.getTransactions({ dateRange: { start: dateStr, end: dateStr } });
      const revenue = transactions
        .filter(t => t.paymentMethod !== PAYMENT_METHODS.PENDING)
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        date: dateStr,
        label: dayLabel,
        revenue,
        transactions: transactions.length
      });
    }

    return data;
  },

  /**
   * Get revenue data for charts (last 30 days)
   */
  getRevenueChart30Days: () => {
    const data = {};
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      data[dateStr] = {
        date: dateStr,
        revenue: 0,
        transactions: 0
      };
    }

    const transactions = financeiroService.getTransactions();
    transactions.forEach(t => {
      if (data[t.date] && t.paymentMethod !== PAYMENT_METHODS.PENDING) {
        data[t.date].revenue += t.amount;
        data[t.date].transactions++;
      }
    });

    return Object.values(data);
  },

  /**
   * Export transactions to CSV
   */
  exportToCSV: (transactions) => {
    if (!transactions) {
      transactions = financeiroService.getTransactions();
    }

    const headers = ['Data', 'Horário', 'Cliente', 'Serviço', 'Barbeiro', 'Valor', 'Método de Pagamento', 'Status'];
    const rows = transactions.map(t => [
      t.date,
      t.time,
      t.clientName,
      t.serviceName,
      t.barberName,
      `R$ ${t.amount.toFixed(2)}`,
      PAYMENT_METHOD_CONFIG[t.paymentMethod]?.label || t.paymentMethod,
      t.status === 'paid' ? 'Pago' : 'Pendente'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Format date
 */
export const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Format date short
 */
export const formatDateShort = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  });
};

/**
 * Format time
 */
export const formatTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate time slots for a day
 */
export const generateTimeSlots = (openTime, closeTime, interval = 30) => {
  const [openHours, openMinutes] = openTime.split(':').map(Number);
  const [closeHours, closeMinutes] = closeTime.split(':').map(Number);

  const start = openHours * 60 + openMinutes;
  const end = closeHours * 60 + closeMinutes;

  const slots = [];
  for (let time = start; time <= end; time += interval) {
    const hours = Math.floor(time / 60).toString().padStart(2, '0');
    const minutes = (time % 60).toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
  }

  return slots;
};

/**
 * Generate mock appointment data for testing
 */
export const generateMockAppointments = () => {
  const appointments = [];
  const today = new Date();

  for (let i = 0; i < 50; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - Math.floor(Math.random() * 30));
    const dateStr = date.toISOString().split('T')[0];

    const hour = 9 + Math.floor(Math.random() * 9);
    const minute = Math.random() > 0.5 ? '00' : '30';
    const time = `${hour.toString().padStart(2, '0')}:${minute}`;

    const service = MOCK_SERVICES[Math.floor(Math.random() * MOCK_SERVICES.length)];
    const barber = MOCK_BARBERS[Math.floor(Math.random() * MOCK_BARBERS.length)];
    const client = MOCK_CLIENTS[Math.floor(Math.random() * MOCK_CLIENTS.length)];

    const statuses = Object.values(APPOINTMENT_STATUS);
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const paymentMethods = Object.values(PAYMENT_METHODS);
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    appointments.push({
      id: `apt_mock_${i}`,
      clientId: client.id,
      serviceId: service.id,
      barberId: barber.id,
      date: dateStr,
      time,
      duration: service.duration,
      price: service.price,
      status,
      paymentMethod,
      notes: '',
      createdAt: new Date(date).toISOString()
    });
  }

  // Sort by date
  appointments.sort((a, b) => b.date.localeCompare(a.date));
  
  STORAGE.set(STORAGE_KEY_APPOINTMENTS, appointments);
  return appointments;
};

// Initialize mock data if empty
const initializeMockData = () => {
  const appointments = STORAGE.get(STORAGE_KEY_APPOINTMENTS);
  if (!appointments || appointments.length === 0) {
    generateMockAppointments();
  }
};

// Run initialization
initializeMockData();

// ============================================================================
// EXPORTS
// ============================================================================

export {
  appointmentService,
  financeiroService,
  MOCK_SERVICES,
  MOCK_BARBERS,
  MOCK_CLIENTS,
  generateTimeSlots,
  generateMockAppointments
};

export default {
  appointmentService,
  financeiroService,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatTime,
  getInitials,
  generateTimeSlots,
  generateMockAppointments,
  APPOINTMENT_STATUS,
  PAYMENT_METHODS,
  APPOINTMENT_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  MOCK_SERVICES,
  MOCK_BARBERS,
  MOCK_CLIENTS
};
