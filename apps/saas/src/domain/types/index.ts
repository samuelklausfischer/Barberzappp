
export type AppView = 'login' | 'dashboard' | 'agenda' | 'finance' | 'whatsapp' | 'settings' | 'services' | 'aiconfig';

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  time: string;
  duration: string;
  price: number;
  status: 'confirmed' | 'pending' | 'canceled';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  popular: boolean;
  icon: string;
}

export interface FinancialStats {
  revenue: number;
  growth: number;
  ticketMedio: number;
  appointmentsCount: number;
  newClients: number;
}
