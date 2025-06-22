
interface LiveAuctionSchedule {
  car_id: string;
  status: string;
  start_time: string;
  end_time: string;
  is_manually_controlled: boolean;
}

export const processSchedulesData = (schedulesData: any[]): LiveAuctionSchedule[] => {
  const schedules: LiveAuctionSchedule[] = [];
  
  if (schedulesData && Array.isArray(schedulesData)) {
    // Process each item with proper null checks and type validation
    for (const item of schedulesData) {
      // First check if item is not null/undefined and is an object
      if (!item || typeof item !== 'object') {
        continue;
      }
      
      // Type assertion after null check
      const scheduleItem = item as Record<string, any>;
      
      // Check if all required properties exist and have correct types
      if ('car_id' in scheduleItem &&
          'status' in scheduleItem &&
          'start_time' in scheduleItem &&
          'end_time' in scheduleItem &&
          'is_manually_controlled' in scheduleItem &&
          typeof scheduleItem.car_id === 'string' &&
          typeof scheduleItem.status === 'string' &&
          typeof scheduleItem.start_time === 'string' &&
          typeof scheduleItem.end_time === 'string' &&
          typeof scheduleItem.is_manually_controlled === 'boolean') {
        schedules.push({
          car_id: scheduleItem.car_id,
          status: scheduleItem.status,
          start_time: scheduleItem.start_time,
          end_time: scheduleItem.end_time,
          is_manually_controlled: scheduleItem.is_manually_controlled
        });
      }
    }
  }
  
  return schedules;
};
