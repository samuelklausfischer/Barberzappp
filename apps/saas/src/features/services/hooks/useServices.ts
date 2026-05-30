
import { useState } from 'react';
import { Service } from '../types';
import { MOCK_SERVICES } from '../mocks/mockServices';

export const useServices = () => {
  const [services, setServices] = useState<Service[]>(MOCK_SERVICES);

  return {
    services,
    setServices,
  };
};
