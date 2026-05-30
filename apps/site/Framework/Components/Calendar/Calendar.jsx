/**
 * BarberZap Calendar Component
 * 
 * A flexible calendar component for appointment scheduling
 * Supports month, week, and day views
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  Plus,
  Filter,
  Loader2
} from 'lucide-react';

// Portuguese month names
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Portuguese day names (abbreviated)
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Mini appointment card for calendar grid
 */
const AppointmentCard = ({ appointment, onClick, compact = false }) => {
  const timeOnly = appointment.time;
  
  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-lg p-2 text-xs transition-all
        ${compact ? 'p-1.5' : 'p-2'}
        hover:scale-[1.02] hover:shadow-lg
        ${
          appointment.status === 'confirmed' 
            ? 'bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50' 
          : appointment.status === 'pending'
            ? 'bg-yellow-500/20 border border-yellow-500/30 hover:border-yellow-500/50'
          : appointment.status === 'completed'
            ? 'bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50'
          : appointment.status === 'cancelled'
            ? 'bg-red-500/20 border border-red-500/30 hover:border-red-500/50'
            : 'bg-gray-500/20 border border-gray-500/30'
        }
      `}
    >
      {compact ? (
        <div className="flex items-center gap-1 truncate">
          <span className="font-medium">{timeOnly}</span>
          <span className="truncate opacity-80">{appointment.clientName}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 opacity-70" />
            <span className="font-medium">{timeOnly}</span>
          </div>
          <div className="flex items-center gap-1 truncate text-gray-300">
            <User className="w-3 h-3 opacity-70" />
            <span className="truncate">{appointment.clientName}</span>
          </div>
          <div className="flex items-center gap-1 truncate text-gray-400 mt-1">
            <Scissors className="w-3 h-3 opacity-70" />
            <span className="truncate">{appointment.serviceName}</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Time slot for day/week view
 */
const TimeSlot = ({ time, appointments, onClick, onSlotClick }) => {
  return (
    <div className="flex border-b border-slate-700/50 min-h-[60px]">
      <div className="w-16 py-2 px-2 text-right text-xs text-gray-500 font-medium flex-shrink-0">
        {time}
      </div>
      <div 
        className="flex-1 p-1 space-y-1 hover:bg-slate-700/20 transition-colors cursor-pointer"
        onClick={() => onSlotClick && onSlotClick(time)}
      >
        {appointments.map(apt => (
          <AppointmentCard 
            key={apt.id} 
            appointment={apt} 
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick(apt);
            }}
            compact
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN CALENDAR COMPONENT
// ============================================================================

const Calendar = ({
  appointments = [],
  view = 'month', // 'month', 'week', 'day'
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onSlotClick,
  onMonthChange,
  loading = false,
  showViewSwitcher = true,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date());
  const [localView, setLocalView] = useState(view);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    setCurrentDate(selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date());
  }, [selectedDate]);

  useEffect(() => {
    setLocalView(view);
  }, [view]);

  // Navigation
  const navigate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (localView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
    }
    
    setCurrentDate(newDate);
    onMonthChange && onMonthChange(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    onMonthChange && onMonthChange(new Date());
  };

  // Date helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    
    // Add padding days for start of month
    for (let i = startDayOfWeek; i > 0; i--) {
      const padDate = new Date(year, month, -i + 1);
      days.push({ date: padDate, isPadding: true, dateString: padDate.toISOString().split('T')[0] });
    }
    
    // Add actual days of month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({ date: dayDate, isPadding: false, dateString: dayDate.toISOString().split('T')[0] });
    }
    
    // Add padding days for end of month to fill 42 cells (6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const padDate = new Date(year, month + 1, i);
      days.push({ date: padDate, isPadding: true, dateString: padDate.toISOString().split('T')[0] });
    }
    
    return days;
  };

  const getWeekDays = (date) => {
    const dayOfWeek = date.getDay();
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push({
        date: day,
        isToday: isSameDay(day, new Date()),
        dateString: day.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const isSameDay = (date1, date2) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const isToday = (date) => isSameDay(date, new Date());

  const isSelected = (dateStr) => selectedDate === dateStr;

  const getAppointmentsForDate = (dateStr) => {
    return appointments.filter(apt => apt.date === dateStr);
  };

  // Generate time slots for day/week view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 18) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  // Handle day click
  const handleDayClick = (dayInfo) => {
    if (dayInfo.isPadding) return;
    onDateSelect && onDateSelect(dayInfo.dateString);
  };

  // ============================================================================
  // VIEWS
  // ============================================================================

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const today = new Date();

    return (
      <div className="w-full">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS_SHORT.map((day, i) => (
            <div 
              key={i} 
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((dayInfo, index) => {
            const dayAppointments = getAppointmentsForDate(dayInfo.dateString);
            const isTodayDate = isToday(dayInfo.date);
            const isSelectedDate = isSelected(dayInfo.dateString);
            const isPadding = dayInfo.isPadding;

            return (
              <div
                key={index}
                onClick={() => handleDayClick(dayInfo)}
                onMouseEnter={() => setHoveredDay(dayInfo.dateString)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`
                  min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg border transition-all
                  ${isPadding ? 'opacity-30' : 'cursor-pointer hover:border-slate-500'}
                  ${isTodayDate ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50' : 'bg-slate-800/30 border-slate-700/50'}
                  ${isSelectedDate ? 'ring-2 ring-amber-500' : ''}
                  ${hoveredDay === dayInfo.dateString ? 'border-slate-500' : ''}
                `}
              >
                <div 
                  className={`
                    text-sm font-medium mb-1
                    ${isTodayDate ? 'bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-400'}
                  `}
                >
                  {dayInfo.date.getDate()}
                </div>
                
                {!isPadding && dayAppointments.length > 0 && (
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(apt => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick && onAppointmentClick(apt);
                        }}
                        compact
                      />
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 3} mais
                      </div>
                    )}
                  </div>
                )}

                {!isPadding && onSlotClick && (
                  <div 
                    className="absolute inset-0 flex items-center justify-end p-1 opacity-0 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick(dayInfo.dateString);
                    }}
                  >
                    <Plus className="w-5 h-5 text-gray-400 hover:text-amber-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const timeSlots = generateTimeSlots();

    return (
      <div className="w-full overflow-x-auto">
        {/* Week header */}
        <div className="flex mb-2 pr-16">
          <div className="w-16 flex-shrink-0" />
          {weekDays.map((dayInfo, i) => (
            <div
              key={i}
              onClick={() => onDateSelect && onDateSelect(dayInfo.dateString)}
              className={`
                flex-1 text-center p-2 rounded-lg cursor-pointer transition-all
                ${dayInfo.isToday ? 'bg-amber-500/10' : 'bg-slate-800/30'}
                ${isSelected(dayInfo.dateString) ? 'ring-2 ring-amber-500' : ''}
              `}
            >
              <div className="text-xs text-gray-500">{WEEKDAYS_SHORT[i]}</div>
              <div className={`
                text-lg font-medium mt-1
                ${dayInfo.isToday ? 'text-amber-400' : 'text-gray-300'}
              `}>
                {dayInfo.date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div>
          {timeSlots.map(time => (
            <div key={time} className="flex border-b border-slate-700/50 min-h-[60px]">
              <div className="w-16 py-2 px-2 text-right text-xs text-gray-500 font-medium flex-shrink-0">
                {time}
              </div>
              <div className="flex flex-1">
                {weekDays.map((dayInfo, dayIndex) => (
                  <div
                    key={dayIndex}
                    onClick={() => onSlotClick && onSlotClick(dayInfo.dateString, time)}
                    className="flex-1 p-1 space-y-1 border-r border-slate-700/30 hover:bg-slate-700/20 cursor-pointer relative"
                  >
                    {getAppointmentsForDate(dayInfo.dateString)
                      .filter(apt => apt.time === time)
                      .map(apt => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick && onAppointmentClick(apt);
                          }}
                          compact
                        />
                      ))}
                    {onSlotClick && (
                      <Plus className="absolute bottom-1 right-1 w-4 h-4 text-gray-600 hover:text-amber-400 opacity-0 hover:opacity-100" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const timeSlots = generateTimeSlots();
    const dayAppointments = getAppointmentsForDate(currentDate.toISOString().split('T')[0]);

    return (
      <div className="w-full">
        {/* Day header */}
        <div className="flex items-center justify-between mb-4 p-4 bg-slate-800/30 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">{WEEKDAYS_FULL[currentDate.getDay()]}</div>
            <div className={`text-3xl font-bold ${isToday(currentDate) ? 'text-amber-400' : 'text-white'}`}>
              {currentDate.getDate()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Agendamentos</div>
            <div className="text-2xl font-bold text-white">{dayAppointments.length}</div>
          </div>
        </div>

        {/* Time slots */}
        <div>
          {timeSlots.map(time => (
            <TimeSlot
              key={time}
              time={time}
              appointments={dayAppointments.filter(apt => apt.time === time)}
              onClick={onAppointmentClick}
              onSlotClick={(slotTime) => onSlotClick && onSlotClick(currentDate.toISOString().split('T')[0], slotTime)}
            />
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // HEADER
  // ============================================================================

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        {/* Title & Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {localView === 'month' && (
            <h3 className="text-xl font-bold text-white min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          )}
          
          {localView === 'week' && (
            <h3 className="text-xl font-bold text-white min-w-[200px] text-center">
              {new Date(currentDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
          )}
          
          {localView === 'day' && (
            <h3 className="text-xl font-bold text-white min-w-[200px] text-center">
              {currentDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </h3>
          )}
          
          <button
            onClick={() => navigate(1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* View Switcher */}
        {showViewSwitcher && (
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            {['Mês', 'Semana', 'Dia'].map((v, i) => {
              const viewKey = ['month', 'week', 'day'][i];
              const isActive = localView === viewKey;
              
              return (
                <button
                  key={v}
                  onClick={() => setLocalView(viewKey)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive 
                      ? 'bg-amber-500 text-slate-900' 
                      : 'text-gray-400 hover:text-white hover:bg-slate-700'
                    }
                  `}
                >
                  {v}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`calendar ${className}`}>
      {renderHeader()}
      
      <div className="min-h-[500px]">
        {localView === 'month' && renderMonthView()}
        {localView === 'week' && renderWeekView()}
        {localView === 'day' && renderDayView()}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Calendar;
export { AppointmentCard, TimeSlot };
