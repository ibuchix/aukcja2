
// Helper function to determine auction timing status - ALWAYS use calculated time
export const calculateAuctionTimingStatus = (
  scheduleStartTime?: string,
  scheduleEndTime?: string,
  scheduleStatus?: string
): 'scheduled' | 'running' | 'ended' | 'unknown' => {
  if (!scheduleStartTime || !scheduleEndTime) {
    return 'unknown';
  }

  const now = new Date();
  const startTime = new Date(scheduleStartTime);
  const endTime = new Date(scheduleEndTime);

  // Time-based calculation takes priority over database status
  // Check if auction has ended (past end time)
  if (now > endTime) {
    return 'ended';
  }
  
  // Check if auction is currently running (between start and end time)
  if (now >= startTime && now <= endTime) {
    return 'running';
  }
  
  // Check if auction is scheduled for the future (before start time)
  if (now < startTime) {
    return 'scheduled';
  }
  
  return 'unknown';
};
