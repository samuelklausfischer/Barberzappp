export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  popular: boolean;
  icon: string;
  active: boolean;
  status: string | null;
  barberId: string | null;
  barberName: string | null;
}

export type ActiveBarber = { id: string; name: string };
