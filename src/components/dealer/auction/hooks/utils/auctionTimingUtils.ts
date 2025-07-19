
import { isCurrentlyBetweenTimes, isCurrentlyAfter, isCurrentlyBefore } from "@/utils/ukTimeUtils";

// Helper function to determine auction timing status using UK time
export const calculateAuctionTimingStatus = (
  scheduleStartTime?: string,
  scheduleEndTime?: string,
  scheduleStatus?: string
): 'scheduled' | 'active' | 'ended' | 'unknown' => {
  if (!scheduleStartTime || !scheduleEndTime) {
    return 'unknown';
  }

  console.log('Calculating auction timing status:', {
    scheduleStartTime,
    scheduleEndTime,
    scheduleStatus,
    currentTime: new Date().toISOString(),
    ukTime: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
  });

  // Time-based calculation takes priority over database status
  // Check if auction has ended (past end time)
  if (isCurrentlyAfter(scheduleEndTime)) {
    console.log('Auction has ended - current time is after end time');
    return 'ended';
  }
  
  // Check if auction is currently active (between start and end time)
  if (isCurrentlyBetweenTimes(scheduleStartTime, scheduleEndTime)) {
    console.log('Auction is currently active - current time is between start and end');
    return 'active';
  }
  
  // Check if auction is scheduled for the future (before start time)
  if (isCurrentlyBefore(scheduleStartTime)) {
    console.log('Auction is scheduled - current time is before start time');
    return 'scheduled';
  }
  
  console.log('Auction timing status unknown');
  return 'unknown';
};
