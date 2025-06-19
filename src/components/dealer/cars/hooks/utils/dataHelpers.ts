
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
  }).filter(car => car.scheduleStatus === 'running'); // Only return cars with running schedules

  console.log("Merged data result:", {
    originalCars: cars.length,
    mergedCars: mergedData.length,
    filteredToRunning: mergedData.filter(c => c.scheduleStatus === 'running').length
  });

  return mergedData;
};
