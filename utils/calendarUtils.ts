/**
 * Calendar utility functions for date calculations and calendar grid generation
 */

export interface CalendarEventData {
  date: Date;
  type: 'sales' | 'inventory' | 'meeting' | 'deadline' | 'holiday';
  count?: number;
  title?: string;
  color?: string;
}

export interface CalendarDate {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEventData[];
}

/**
 * Get the number of days in a specific month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Get the first day of the week for a specific month (0 = Sunday, 6 = Saturday)
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

/**
 * Check if a date is in the current month
 */
export const isCurrentMonth = (date: Date, currentMonth: number, currentYear: number): boolean => {
  return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date, format: 'short' | 'long' | 'numeric' = 'short'): string => {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    numeric: { year: 'numeric', month: '2-digit', day: '2-digit' }
  }[format];

  return date.toLocaleDateString('en-US', options);
};

/**
 * Get month name from month index
 */
export const getMonthName = (month: number, format: 'long' | 'short' = 'long'): string => {
  const date = new Date(2000, month, 1);
  return date.toLocaleDateString('en-US', { 
    month: format === 'long' ? 'long' : 'short' 
  });
};

/**
 * Get weekday names
 */
export const getWeekdayNames = (format: 'long' | 'short' | 'narrow' = 'short'): string[] => {
  const weekdays = [];
  const currentYear = new Date().getFullYear();
  // Use current year instead of hardcoded 2024
  const baseDate = new Date(currentYear, 0, 7); // First Sunday of the current year
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    weekdays.push(date.toLocaleDateString('en-US', { weekday: format }));
  }
  
  return weekdays;
};

/**
 * Navigate to previous month
 */
export const getPreviousMonth = (currentMonth: number, currentYear: number): { month: number; year: number } => {
  if (currentMonth === 0) {
    return { month: 11, year: currentYear - 1 };
  }
  return { month: currentMonth - 1, year: currentYear };
};

/**
 * Navigate to next month
 */
export const getNextMonth = (currentMonth: number, currentYear: number): { month: number; year: number } => {
  if (currentMonth === 11) {
    return { month: 0, year: currentYear + 1 };
  }
  return { month: currentMonth + 1, year: currentYear };
};

/**
 * Generate calendar grid for a specific month
 */
export const generateCalendarGrid = (
  year: number,
  month: number,
  selectedDate?: Date,
  eventData: CalendarEventData[] = []
): CalendarDate[] => {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month === 0 ? 11 : month - 1);
  
  const calendarDates: CalendarDate[] = [];
  
  // Filter events to only include those relevant to the displayed date range
  // This avoids checking every event for every date
  const startDate = new Date(year, month - 1, daysInPrevMonth - firstDayOfWeek + 1);
  const endDate = new Date(year, month + 1, 42 - daysInMonth - firstDayOfWeek);
  const relevantEvents = filterEventsByDateRange(eventData, startDate, endDate);
  
  // Create a map of events by date for faster lookup
  const eventsByDate = new Map<string, CalendarEventData[]>();
  relevantEvents.forEach(event => {
    const dateKey = event.date.toDateString();
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });
  
  // Add days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    const dateEvents = eventsByDate.get(date.toDateString()) || [];
    
    calendarDates.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: dateEvents,
    });
  }
  
  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateEvents = eventsByDate.get(date.toDateString()) || [];
    
    calendarDates.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isToday(date),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: dateEvents,
    });
  }
  
  // Calculate how many days we need from next month to complete the grid
  // Only generate enough cells to show complete weeks
  const remainingCells = (7 - (calendarDates.length % 7)) % 7;
  const weeksToShow = Math.ceil(calendarDates.length / 7);
  const totalCells = weeksToShow * 7;
  const nextMonthDays = totalCells - calendarDates.length;
  
  // Add days from next month to complete the grid
  for (let day = 1; day <= nextMonthDays; day++) {
    const date = new Date(year, month + 1, day);
    const dateEvents = eventsByDate.get(date.toDateString()) || [];
    
    calendarDates.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      events: dateEvents,
    });
  }
  
  return calendarDates;
};

/**
 * Filter events by date range
 */
export const filterEventsByDateRange = (
  events: CalendarEventData[],
  startDate: Date,
  endDate: Date
): CalendarEventData[] => {
  return events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startDate && eventDate <= endDate;
  });
};

/**
 * Get events for a specific date
 */
export const getEventsForDate = (events: CalendarEventData[], date: Date): CalendarEventData[] => {
  return events.filter(event => isSameDay(event.date, date));
};

/**
 * Group events by type
 */
export const groupEventsByType = (events: CalendarEventData[]): Record<string, CalendarEventData[]> => {
  return events.reduce((groups, event) => {
    const type = event.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(event);
    return groups;
  }, {} as Record<string, CalendarEventData[]>);
};

/**
 * Get event color by type
 */
export const getEventColor = (type: CalendarEventData['type']): string => {
  const colors = {
    sales: '#10B981',      // Green
    inventory: '#F59E0B',  // Orange
    meeting: '#3B82F6',    // Blue
    deadline: '#EF4444',   // Red
    holiday: '#8B5CF6',    // Purple
  };
  
  return colors[type] || '#6B7280'; // Default gray
};

/**
 * Validate date input
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Create date from year, month, day
 */
export const createDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month, day);
};

/**
 * Get current date info
 */
export const getCurrentDateInfo = () => {
  const now = new Date();
  return {
    date: now,
    year: now.getFullYear(),
    month: now.getMonth(),
    day: now.getDate(),
    dayOfWeek: now.getDay(),
  };
};