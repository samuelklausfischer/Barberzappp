
import { Service } from '../types';

export const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Corte de Cabelo', description: 'Degradê, Social e Tesoura', price: 45, duration: 45, popular: true, icon: 'content_cut' },
  { id: '2', name: 'Barba Completa', description: 'Modelagem e toalha quente', price: 35, duration: 30, popular: false, icon: 'face' },
  { id: '3', name: 'Corte + Barba', description: 'Combo com desconto', price: 70, duration: 75, popular: true, icon: 'content_cut' },
];
