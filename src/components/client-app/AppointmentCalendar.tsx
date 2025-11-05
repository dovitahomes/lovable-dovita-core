import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppointmentCalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date | undefined) => void;
  appointmentDates: Date[];
}

export default function AppointmentCalendar({ 
  selectedDate, 
  onDateSelect, 
  appointmentDates 
}: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <h2 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        locale={es}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        className="rounded-lg border p-3 pointer-events-auto appointment-calendar"
        modifiers={{
          hasAppointment: appointmentDates,
        }}
        modifiersClassNames={{
          hasAppointment: 'has-appointment',
        }}
      />
    </div>
  );
}
