
/**
 * UK Time Utilities
 * Handles all time-related operations with UK timezone (Europe/London)
 */

// Get current UK time as a Date object
export const getCurrentUKTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/London' }));
};

// Convert any date string to UK time Date object
export const toUKTime = (dateString: string): Date => {
  return new Date(new Date(dateString).toLocaleString('en-US', { timeZone: 'Europe/London' }));
};

// Format date for UK display
export const formatUKDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format date for UK display (short format)
export const formatUKDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Compare times in UTC (for consistent server-side comparison)
export const compareTimesUTC = (time1: string, time2: string): number => {
  const date1 = new Date(time1);
  const date2 = new Date(time2);
  return date1.getTime() - date2.getTime();
};

// Check if current UK time is between start and end times
export const isCurrentlyBetweenTimes = (startTime: string, endTime: string): boolean => {
  const now = new Date(); // This is already in UTC
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  return now >= start && now <= end;
};

// Check if current UK time is after the given time
export const isCurrentlyAfter = (time: string): boolean => {
  const now = new Date(); // This is already in UTC
  const target = new Date(time);
  
  return now > target;
};

// Check if current UK time is before the given time
export const isCurrentlyBefore = (time: string): boolean => {
  const now = new Date(); // This is already in UTC
  const target = new Date(time);
  
  return now < target;
};
