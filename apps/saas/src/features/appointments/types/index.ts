
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
