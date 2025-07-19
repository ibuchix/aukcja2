
export interface AuctionScheduleData {
  car_id: string;
  status: string;
  start_time: string;
  end_time: string;
  is_manually_controlled?: boolean;
}

export interface CarWithSchedule {
  // All car properties
  [key: string]: any;
  // Added schedule properties
  scheduleStatus?: string;
  scheduleStartTime?: string;
  scheduleEndTime?: string;
  isManuallyControlled?: boolean;
}

// Helper function to determine if an auction should be considered active based on time
const isAuctionActiveByTime = (startTime: string, endTime: string): boolean => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  // Auction is active if current time is between start and end times
  return now >= start && now <= end;
};

// Helper function to determine if an auction is upcoming (scheduled for future)
const isAuctionUpcoming = (startTime: string): boolean => {
  const now = new Date();
  const start = new Date(startTime);
  
  // Auction is upcoming if start time is in the future
  return start > now;
};

export const mergeCarDataWithSchedules = (
  cars: any[],
  schedules: AuctionScheduleData[]
): CarWithSchedule[] => {
  console.log("Merging car data with schedules:", {
    carsCount: cars.length,
    schedulesCount: schedules.length
  });

  // Create a map of car_id to schedule data for quick lookup
  const scheduleMap = new Map<string, AuctionScheduleData>();
  schedules.forEach(schedule => {
    if (schedule.car_id) {
      scheduleMap.set(schedule.car_id, schedule);
    }
  });

  // Merge car data with schedule data
  const mergedData = cars.map(car => {
    const schedule = scheduleMap.get(car.id);
    
    if (schedule) {
      return {
        ...car,
        // Add schedule data in camelCase format for consistency
        scheduleStatus: schedule.status,
        scheduleStartTime: schedule.start_time,
        scheduleEndTime: schedule.end_time,
        isManuallyControlled: schedule.is_manually_controlled
      };
    }
    
    // If no schedule found, return car as-is (shouldn't happen in live auctions)
    console.warn("No schedule found for car:", car.id);
    return car;
  }).filter(car => {
    // Updated filter logic: Accept both 'scheduled' and 'active' statuses
    // but apply time-based filtering to determine actual availability
    if (!car.scheduleStatus || !car.scheduleStartTime || !car.scheduleEndTime) {
      console.warn("Car missing schedule data:", car.id);
      return false;
    }

    const status = car.scheduleStatus;
    const startTime = car.scheduleStartTime;
    const endTime = car.scheduleEndTime;

    // Log the filtering decision for debugging
    console.log(`Filtering car ${car.id}:`, {
      status,
      startTime,
      endTime,
      isActiveByTime: isAuctionActiveByTime(startTime, endTime),
      isUpcoming: isAuctionUpcoming(startTime)
    });

    // Accept auctions that are:
    // 1. 'active' status (should always be shown if within time bounds)
    // 2. 'scheduled' status BUT currently within the auction time window
    // 3. 'scheduled' status AND starting soon (within next hour for preparation)
    
    if (status === 'active') {
      // Active auctions should be shown if they haven't ended yet
      const now = new Date();
      const end = new Date(endTime);
      return now <= end;
    }
    
    if (status === 'scheduled') {
      // For scheduled auctions, check if they should be active based on time
      if (isAuctionActiveByTime(startTime, endTime)) {
        console.log(`Scheduled auction ${car.id} is now active based on time`);
        return true;
      }
      
      // Also include auctions starting within the next hour for dealer preparation
      const now = new Date();
      const start = new Date(startTime);
      const timeUntilStart = start.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;
      
      if (timeUntilStart > 0 && timeUntilStart <= oneHourInMs) {
        console.log(`Scheduled auction ${car.id} starts within an hour`);
        return true;
      }
    }
    
    // Filter out completed, cancelled, or other statuses
    console.log(`Filtering out car ${car.id} with status ${status}`);
    return false;
  });

  console.log("Merged data result:", {
    originalCars: cars.length,
    mergedCars: mergedData.length,
    filteredToActive: mergedData.filter(c => {
      if (!c.scheduleStartTime || !c.scheduleEndTime) return false;
      return c.scheduleStatus === 'active' || isAuctionActiveByTime(c.scheduleStartTime, c.scheduleEndTime);
    }).length
  });

  return mergedData;
};
