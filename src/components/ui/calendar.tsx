import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const calendarVariants = cva(
  "p-3 rounded-lg border border-border bg-background relative w-full shadow-sm",
  {
    variants: {
      size: {
        sm: "p-2 text-sm",
        default: "p-3",
        lg: "p-4 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const dayVariants = cva(
  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 transition-all",
  {
    variants: {
      size: {
        sm: "h-7 w-7 text-xs",
        default: "h-9 w-9 text-sm",
        lg: "h-10 w-10 text-base",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type CalendarProps = React.ComponentProps<typeof DayPicker> & 
  VariantProps<typeof calendarVariants> & {
    showMonthYearPickers?: boolean;
  };

function Calendar({ 
  className, 
  classNames, 
  showOutsideDays = true, 
  size,
  showMonthYearPickers = false,
  ...props 
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.month || new Date());
  
  const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  
  const currentYear = month.getFullYear();
  const yearRange = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      month={month}
      onMonthChange={setMonth}
      className={cn(calendarVariants({ size }), "calendar-month-transition", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: showMonthYearPickers ? "hidden" : "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity rounded-md hover:bg-accent",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(dayVariants({ size }), "hover:bg-accent hover:text-accent-foreground"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-semibold",
        day_today: "bg-accent text-accent-foreground font-semibold",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: showMonthYearPickers ? ({ displayMonth }) => (
          <div className="flex items-center gap-2 justify-center">
            <Select
              value={displayMonth.getMonth().toString()}
              onValueChange={(value) => {
                const newDate = new Date(displayMonth);
                newDate.setMonth(parseInt(value));
                setMonth(newDate);
              }}
            >
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((monthName, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={displayMonth.getFullYear().toString()}
              onValueChange={(value) => {
                const newDate = new Date(displayMonth);
                newDate.setFullYear(parseInt(value));
                setMonth(newDate);
              }}
            >
              <SelectTrigger className="w-[80px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearRange.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : undefined,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
