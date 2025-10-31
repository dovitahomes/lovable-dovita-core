import { 
  differenceInWeeks, 
  addWeeks, 
  startOfDay, 
  eachWeekOfInterval, 
  startOfWeek,
  endOfWeek,
  format
} from "date-fns";

export type WeekCell = {
  weekNumber: number; // 1-based within the gantt
  monthNumber: number; // Which "Mes N" this belongs to (1-based)
  weekInMonth: number; // 1-4 within the month
  startDate: Date;
  endDate: Date;
};

/**
 * Given a start and end date, calculate all weeks and assign them to "Mes 1", "Mes 2", etc.
 * Each month = 4 weeks.
 */
export function calculateGanttWeeks(startDate: Date, endDate: Date): WeekCell[] {
  const start = startOfDay(startOfWeek(startDate, { weekStartsOn: 1 })); // Monday
  const end = startOfDay(endOfWeek(endDate, { weekStartsOn: 1 }));
  
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  
  return weeks.map((weekStart, index) => {
    const weekNumber = index + 1;
    const monthNumber = Math.floor(index / 4) + 1;
    const weekInMonth = (index % 4) + 1;
    
    return {
      weekNumber,
      monthNumber,
      weekInMonth,
      startDate: weekStart,
      endDate: endOfWeek(weekStart, { weekStartsOn: 1 }),
    };
  });
}

/**
 * Calculate weeks needed to fit a duration (in days)
 */
export function weeksForDuration(durationDays: number): number {
  return Math.ceil(durationDays / 7);
}

/**
 * Group weeks by month number
 */
export function groupWeeksByMonth(weeks: WeekCell[]): Map<number, WeekCell[]> {
  const map = new Map<number, WeekCell[]>();
  
  weeks.forEach(week => {
    if (!map.has(week.monthNumber)) {
      map.set(week.monthNumber, []);
    }
    map.get(week.monthNumber)!.push(week);
  });
  
  return map;
}

/**
 * Calculate the position (left, width) of a bar in the timeline
 */
export function calculateBarPosition(
  itemStart: Date,
  itemEnd: Date,
  timelineStart: Date,
  timelineEnd: Date
): { left: number; width: number } {
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const startOffset = Math.max(0, itemStart.getTime() - timelineStart.getTime());
  const duration = itemEnd.getTime() - itemStart.getTime();
  
  const left = (startOffset / totalDuration) * 100;
  const width = (duration / totalDuration) * 100;
  
  return {
    left: Math.max(0, Math.min(100, left)),
    width: Math.max(0, Math.min(100 - left, width)),
  };
}

/**
 * Calculate the position of a vertical line (ministration) in the timeline
 */
export function calculateLinePosition(
  date: Date,
  timelineStart: Date,
  timelineEnd: Date
): number {
  const totalDuration = timelineEnd.getTime() - timelineStart.getTime();
  const offset = date.getTime() - timelineStart.getTime();
  
  return Math.max(0, Math.min(100, (offset / totalDuration) * 100));
}

/**
 * Snap a date to the nearest week start
 */
export function snapToWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Format week range for display
 */
export function formatWeekRange(week: WeekCell): string {
  return `${format(week.startDate, "dd/MM")} - ${format(week.endDate, "dd/MM")}`;
}
