
import { Appointment } from '../types';

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '1', clientName: 'João Silva', clientAvatar: 'https://picsum.photos/id/64/100/100', service: 'Corte Navalhado', time: '14:00', duration: '30 min', price: 45, status: 'confirmed' },
  { id: '2', clientName: 'Pedro Santos', clientAvatar: 'https://picsum.photos/id/65/100/100', service: 'Barba e Cabelo', time: '15:30', duration: '45 min', price: 70, status: 'pending' },
  { id: '3', clientName: 'Lucas Oliveira', clientAvatar: 'https://picsum.photos/id/66/100/100', service: 'Sobrancelha', time: '17:00', duration: '15 min', price: 20, status: 'canceled' },
  { id: '4', clientName: 'Marcos Souza', clientAvatar: 'https://picsum.photos/id/67/100/100', service: 'Corte Completo + Barba', time: '18:00', duration: '60 min', price: 90, status: 'confirmed' },
];
