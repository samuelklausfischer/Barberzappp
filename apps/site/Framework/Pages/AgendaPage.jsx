/**
 * BarberZap Agenda Page
 * 
 * Complete appointment scheduling with calendar view, appointment management,
 * and statistics
 */

import React, { useState, useEffect } from 'react';
import { DashboardContainer } from '../CoreComponents';
import Calendar from '../Components/Calendar';
import {
  appointmentService,
  financeiroService,
  MOCK_SERVICES,
  MOCK_BARBERS,
  MOCK_CLIENTS,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_CONFIG,
  PAYMENT_METHODS,
  PAYMENT_METHOD_CONFIG,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatTime,
  getInitials,
  generateTimeSlots
} from '../Logic/agendaFinanceiro';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  DollarSign,
  Plus,
  Search,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  TrendingUp,
  CalendarCheck,
  CalendarX,
  Timer,
  ChevronRight,
  Download,
  RefreshCw
} from 'lucide-react';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        <span className="text-sm text-gray-400">{title}</span>
      </div>
      {trend && (
        <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

// ============================================================================
// APPOINTMENT DETAIL MODAL
// ============================================================================

const AppointmentDetailModal = ({ appointment, isOpen, onClose, onEdit, onCancel, onConfirm }) => {
  if (!isOpen || !appointment) return null;

  const client = MOCK_CLIENTS.find(c => c.id === appointment.clientId);
  const service = MOCK_SERVICES.find(s => s.id === appointment.serviceId);
  const barber = MOCK_BARBERS.find(b => b.id === appointment.barberId);
  const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status];

  const handleWhatsApp = () => {
    if (client?.phone) {
      const message = encodeURIComponent(`Olá ${client.name}! Confirmação do seu agendamento na barbearia:\n\n📅 ${formatDate(appointment.date)} às ${formatTime(appointment.time)}\n✂️ ${service?.name}\n\nAté logo!`);
      window.open(`https://wa.me/${client.phone.replace(/\D/g,)}?text=${message}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Detalhes do Agendamento</h3>
            <p className="text-sm text-gray-400 mt-1">{formatDate(appointment.date)} às {formatTime(appointment.time)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${statusConfig.color}`}>
          <span>{statusConfig.icon}</span>
          <span>{statusConfig.label}</span>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          {/* Client */}
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Cliente</p>
              <p className="font-medium text-white">{client?.name || 'Não encontrado'}</p>
              <p className="text-sm text-gray-400">{client?.phone || ''}</p>
            </div>
          </div>

          {/* Service */}
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Serviço</p>
              <p className="font-medium text-white">{service?.name || 'Não encontrado'}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span>Duração: {appointment.duration} min</span>
                <span>Valor: {formatCurrency(appointment.price)}</span>
              </div>
            </div>
          </div>

          {/* Barber */}
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-lg">{barber?.avatar || 'BB'}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Barbeiro</p>
              <p className="font-medium text-white">{barber?.name || 'Não encontrado'}</p>
              <p className="text-sm text-gray-400">Comissão: {barber?.commission}%</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Pagamento</p>
              <p className={`font-medium ${PAYMENT_METHOD_CONFIG[appointment.paymentMethod]?.color?.split(' ')[1] || 'text-white'}`}>
                {PAYMENT_METHOD_CONFIG[appointment.paymentMethod]?.label || appointment.paymentMethod}
              </p>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="p-4 bg-slate-900/50 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">Observações</p>
              <p className="text-sm text-gray-300">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {client?.phone && (
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg font-semibold transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </button>
          )}
          
          {appointment.status === APPOINTMENT_STATUS.PENDING && (
            <button
              onClick={() => onConfirm && onConfirm(appointment)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg font-semibold transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar
            </button>
          )}

          {appointment.status !== APPOINTMENT_STATUS.CANCELLED && appointment.status !== APPOINTMENT_STATUS.COMPLETED && (
            <button
              onClick={() => onCancel && onCancel(appointment)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-all"
            >
              <XCircle className="w-5 h-5" />
              Cancelar
            </button>
          )}

          <button
            onClick={() => onEdit && onEdit(appointment)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all flex-1"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// APPOINTMENT FORM MODAL
// ============================================================================

const AppointmentFormModal = ({ appointment, isOpen, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    serviceId: '',
    barberId: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    duration: 30,
    price: 0,
    status: APPOINTMENT_STATUS.PENDING,
    paymentMethod: PAYMENT_METHODS.PENDING,
    notes: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (appointment) {
      const service = MOCK_SERVICES.find(s => s.id === appointment.serviceId);
      setFormData({
        clientId: appointment.clientId || '',
        serviceId: appointment.serviceId || '',
        barberId: appointment.barberId || '',
        date: appointment.date || new Date().toISOString().split('T')[0],
        time: appointment.time || '',
        duration: appointment.duration || service?.duration || 30,
        price: appointment.price || service?.price || 0,
        status: appointment.status || APPOINTMENT_STATUS.PENDING,
        paymentMethod: appointment.paymentMethod || PAYMENT_METHODS.PENDING,
        notes: appointment.notes || ''
      });
    } else {
      setFormData({
        clientId: '',
        serviceId: '',
        barberId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        duration: 30,
        price: 0,
        status: APPOINTMENT_STATUS.PENDING,
        paymentMethod: PAYMENT_METHODS.PENDING,
        notes: ''
      });
    }
  }, [appointment, isOpen]);

  useEffect(() => {
    if (formData.barberId && formData.date && formData.serviceId) {
      const service = MOCK_SERVICES.find(s => s.id === formData.serviceId);
      const slots = appointmentService.getAvailableSlots(
        formData.barberId,
        formData.date,
        service?.duration || 30
      );
      setAvailableSlots(slots);
    } else {
      setAvailableSlots([]);
    }
  }, [formData.barberId, formData.date, formData.serviceId]);

  const handleServiceChange = (serviceId) => {
    const service = MOCK_SERVICES.find(s => s.id === serviceId);
    setFormData(prev => ({
      ...prev,
      serviceId,
      duration: service?.duration || 30,
      price: service?.price || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientId || !formData.serviceId || !formData.barberId || !formData.date || !formData.time) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    await onSave(formData);
  };

  if (!isOpen) return null;

  const selectedService = MOCK_SERVICES.find(s => s.id === formData.serviceId);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">
              {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>
            <p className="text-sm text-gray-400 mt-1">{appointment ? 'Altere os detalhes abaixo' : 'Preencha os dados do agendamento'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Cliente *</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            >
              <option value="">Selecione o cliente</option>
              {MOCK_CLIENTS.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Serviço *</label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            >
              <option value="">Selecione o serviço</option>
              {MOCK_SERVICES.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatCurrency(service.price)} ({service.duration} min)
                </option>
              ))}
            </select>
          </div>

          {/* Barber */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Barbeiro *</label>
            <select
              value={formData.barberId}
              onChange={(e) => setFormData(prev => ({ ...prev, barberId: e.target.value }))}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            >
              <option value="">Selecione o barbeiro</option>
              {MOCK_BARBERS.map(barber => (
                <option key={barber.id} value={barber.id}>
                  {barber.name} (Comissão: {barber.commission}%)
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Data *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={today}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              required
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Horário *</label>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableSlots.map((slot, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, time: slot.time }))}
                    className={`
                      p-2 rounded-lg text-sm font-medium transition-all
                      ${formData.time === slot.time 
                        ? 'bg-amber-500 text-slate-900 ring-2 ring-amber-400' 
                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                      }
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              <select
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                required
              >
                <option value="">Selecione o horário</option>
                {generateTimeSlots('09:00', '18:00').map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Duration & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Duração (min)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                min="15"
                step="5"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Preço (R$)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                min="0"
                step="0.01"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            >
              {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Método de Pagamento</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
            >
              {Object.entries(PAYMENT_METHOD_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 resize-none"
              placeholder="Adicione observações sobre o agendamento..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : (appointment ? 'Atualizar' : 'Agendar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN AGENDA PAGE
// ============================================================================

export const AgendaPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    cancelled: 0,
    averageDuration: 0
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState('month');

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [barberFilter, setBarberFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load appointments
  useEffect(() => {
    loadAppointments();
  }, [statusFilter, barberFilter]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = appointmentService.getAppointments({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        barberId: barberFilter !== 'all' ? barberFilter : undefined,
        search: searchQuery || undefined
      });
      setAppointments(data);

      // Load stats
      const statsData = appointmentService.getAppointmentStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load appointments for calendar
  const loadCalendarAppointments = () => {
    const currentDate = new Date(selectedDate);
    return appointmentService.getAppointmentsByMonth(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );
  };

  const handleCalendarAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const handleSlotClick = (date, time) => {
    setSelectedAppointment(null);
    setSelectedDate(date);
    setShowFormModal(true);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowFormModal(true);
  };

  const handleSaveAppointment = async (formData) => {
    try {
      setLoading(true);
      if (selectedAppointment) {
        await appointmentService.updateAppointment(selectedAppointment.id, formData);
      } else {
        await appointmentService.createAppointment(formData);
      }
      setShowFormModal(false);
      loadAppointments();
    } catch (error) {
      alert(error.message || 'Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleCancelAppointment = async (appointment) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;

    try {
      await appointmentService.updateAppointment(appointment.id, {
        status: APPOINTMENT_STATUS.CANCELLED
      });
      setShowDetailModal(false);
      loadAppointments();
    } catch (error) {
      alert(error.message || 'Erro ao cancelar agendamento');
    }
  };

  const handleConfirmAppointment = async (appointment) => {
    try {
      await appointmentService.updateAppointment(appointment.id, {
        status: APPOINTMENT_STATUS.CONFIRMED
      });
      setShowDetailModal(false);
      loadAppointments();
    } catch (error) {
      alert(error.message || 'Erro ao confirmar agendamento');
    }
  };

  const handleBulkConfirm = async () => {
    const pendingAppointments = appointments.filter(a => a.status === APPOINTMENT_STATUS.PENDING);
    if (pendingAppointments.length === 0) {
      alert('Não há agendamentos pendentes para confirmar');
      return;
    }

    if (!confirm(`Confirmar ${pendingAppointments.length} agendamentos pendentes?`)) return;

    try {
      setLoading(true);
      for (const apt of pendingAppointments) {
        await appointmentService.updateAppointment(apt.id, {
          status: APPOINTMENT_STATUS.CONFIRMED
        });
      }
      loadAppointments();
    } catch (error) {
      alert('Erro ao confirmar agendamentos em massa');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCancel = async () => {
    const pendingAppointments = appointments.filter(a => a.status === APPOINTMENT_STATUS.PENDING);
    if (pendingAppointments.length === 0) {
      alert('Não há agendamentos pendentes para cancelar');
      return;
    }

    if (!confirm(`Cancelar ${pendingAppointments.length} agendamentos pendentes como não compareceu?`)) return;

    try {
      setLoading(true);
      for (const apt of pendingAppointments) {
        await appointmentService.updateAppointment(apt.id, {
          status: APPOINTMENT_STATUS.NO_SHOW
        });
      }
      loadAppointments();
    } catch (error) {
      alert('Erro ao cancelar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const calendarAppointments = loadCalendarAppointments();

  return (
    <DashboardContainer>
      <div className="p-6 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-amber-400" />
              Agenda
            </h1>
            <p className="text-gray-400 mt-1">Gerencie todos os agendamentos da barbearia</p>
          </div>
          <button
            onClick={handleNewAppointment}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Agendamento
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Hoje"
            value={stats.today}
            icon={CalendarCheck}
            color="text-amber-400"
          />
          <StatCard
            title="Esta Semana"
            value={stats.thisWeek}
            icon={CalendarIcon}
            color="text-blue-400"
          />
          <StatCard
            title="Cancelados"
            value={stats.cancelled}
            icon={CalendarX}
            color="text-red-400"
          />
          <StatCard
            title="Duração Média"
            value={`${stats.averageDuration} min`}
            icon={Timer}
            color="text-emerald-400"
          />
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome do cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer min-w-[140px]"
              >
                <option value="all">Todos Status</option>
                {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Barber Filter */}
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all min-w-[140px]"
            >
              <option value="all">Todos Barbeiros</option>
              {MOCK_BARBERS.map(barber => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkConfirm}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Pendentes
              </button>
              <button
                onClick={handleBulkCancel}
                className="flex items-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-lg transition-all"
              >
                <XCircle className="w-4 h-4" />
                Não Compareceu
              </button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <Calendar
            appointments={calendarAppointments}
            view={view}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAppointmentClick={handleCalendarAppointmentClick}
            onSlotClick={handleSlotClick}
            onMonthChange={(date) => {
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            loading={loading}
            showViewSwitcher
            className="min-h-[500px]"
          />
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEditAppointment}
          onCancel={handleCancelAppointment}
          onConfirm={handleConfirmAppointment}
        />
      )}

      <AppointmentFormModal
        appointment={selectedAppointment}
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveAppointment}
        loading={loading}
      />
    </DashboardContainer>
  );
};

export default AgendaPage;
