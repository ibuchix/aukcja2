
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
      
      // Check if all required properties exist
      if ('car_id' in scheduleItem &&
          'status' in scheduleItem &&
          'start_time' in scheduleItem &&
          'end_time' in scheduleItem &&
          'is_manually_controlled' in scheduleItem) {
        
        // Convert the data types properly
        // car_id might be UUID object or string, convert to string
        const carId = typeof scheduleItem.car_id === 'string' 
          ? scheduleItem.car_id 
          : String(scheduleItem.car_id);
        
        // start_time and end_time might be Date objects or strings, convert to ISO string
        const startTime = scheduleItem.start_time instanceof Date
          ? scheduleItem.start_time.toISOString()
          : typeof scheduleItem.start_time === 'string'
          ? scheduleItem.start_time
          : String(scheduleItem.start_time);
          
        const endTime = scheduleItem.end_time instanceof Date
          ? scheduleItem.end_time.toISOString()
          : typeof scheduleItem.end_time === 'string'
          ? scheduleItem.end_time
          : String(scheduleItem.end_time);
        
        // Validate final types
        if (typeof scheduleItem.status === 'string' &&
            typeof scheduleItem.is_manually_controlled === 'boolean') {
          schedules.push({
            car_id: carId,
            status: scheduleItem.status,
            start_time: startTime,
            end_time: endTime,
            is_manually_controlled: scheduleItem.is_manually_controlled
          });
        }
      }
    }
  }
  
  return schedules;
};
