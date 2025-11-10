import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "react-day-picker/dist/style.css";

interface CalendarViewProps {
  events: any[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function CalendarView({ events, selectedDate, onSelectDate }: CalendarViewProps) {
  // Obtener días con eventos
  const daysWithEvents = events.reduce((acc, event) => {
    const date = new Date(event.start_time);
    const dateKey = date.toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const modifiers = {
    hasEvents: (date: Date) => {
      const dateKey = date.toISOString().split('T')[0];
      return !!daysWithEvents[dateKey];
    }
  };
  
  const modifiersStyles = {
    hasEvents: {
      fontWeight: 'bold',
      position: 'relative' as const,
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calendario</CardTitle>
      </CardHeader>
      <CardContent>
        <style>
          {`
            .rdp-day_selected {
              background-color: hsl(var(--primary)) !important;
              color: hsl(var(--primary-foreground)) !important;
            }
            .rdp-day_today {
              font-weight: bold;
              color: hsl(var(--primary));
            }
            .rdp {
              --rdp-cell-size: 40px;
              --rdp-accent-color: hsl(var(--primary));
            }
            .rdp-day button:hover:not(.rdp-day_selected) {
              background-color: hsl(var(--accent));
            }
          `}
        </style>
        
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={onSelectDate}
          locale={es}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="mx-auto"
          showOutsideDays
          components={{
            DayContent: ({ date }) => {
              const dateKey = date.toISOString().split('T')[0];
              const eventCount = daysWithEvents[dateKey];
              
              return (
                <div className="relative w-full h-full flex items-center justify-center">
                  <span>{date.getDate()}</span>
                  {eventCount && (
                    <div className="absolute bottom-0 flex gap-0.5">
                      {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
        
        {selectedDate && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Eventos en esta fecha:
            </p>
            <Badge variant="secondary">
              {daysWithEvents[selectedDate.toISOString().split('T')[0]] || 0} eventos
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
