import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimePickerProps {
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  occupiedTimes?: string[];
}

export default function TimePicker({ selectedTime, onTimeSelect, occupiedTimes = [] }: TimePickerProps) {
  // Generate time slots from 8:00 AM to 6:00 PM in 30-minute intervals
  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 18 && minute > 0) break; // Stop at 6:00 PM
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="grid grid-cols-2 gap-2">
        {timeSlots.map((time) => {
          const isOccupied = occupiedTimes.includes(time);
          const isSelected = selectedTime === time;

          return (
            <Button
              key={time}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              disabled={isOccupied}
              onClick={() => onTimeSelect(time)}
              className={isOccupied ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {formatTime(time)}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
