
import { useState } from 'react';
import { Appointment } from '../types';
import { MOCK_APPOINTMENTS } from '../mocks/mockAppointments';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  return {
    appointments,
    setAppointments,
  };
};
