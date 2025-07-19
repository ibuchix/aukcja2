/**
 * Centralized auction-related types for the frontend
 * This file provides consistent types that abstract away the database enum inconsistencies
 */

/**
 * Standardized auction timing status for frontend use
 * This replaces the inconsistent database enum that includes both 'running' and 'active'
 */
export type AuctionTimingStatus = 'scheduled' | 'active' | 'ended' | 'unknown';

/**
 * Auction status from the cars table
 */
export type CarAuctionStatus = 'draft' | 'scheduled' | 'active' | 'ended' | 'cancelled' | 'sold';

/**
 * Auction schedule status (normalized from database)
 */
export type AuctionScheduleStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

/**
 * Helper function to normalize auction statuses from the database
 * Converts 'running' to 'active' for consistency
 */
export const normalizeAuctionStatus = (status: string): AuctionScheduleStatus => {
  if (status === 'running') return 'active';
  return status as AuctionScheduleStatus;
};

/**
 * Helper function to determine auction timing status based on schedule data
 */
export const calculateAuctionTimingStatus = (
  scheduleStartTime?: string,
  scheduleEndTime?: string,
  scheduleStatus?: string
): AuctionTimingStatus => {
  if (!scheduleStartTime || !scheduleEndTime) {
    return 'unknown';
  }

  const now = new Date();
  const startTime = new Date(scheduleStartTime);
  const endTime = new Date(scheduleEndTime);

  // Time-based calculation takes priority
  if (now > endTime) {
    return 'ended';
  }
  
  if (now >= startTime && now <= endTime) {
    return 'active';
  }
  
  if (now < startTime) {
    return 'scheduled';
  }
  
  return 'unknown';
};

/**
 * Check if an auction is currently accepting bids
 */
export const isAuctionAcceptingBids = (
  auctionTimingStatus: AuctionTimingStatus,
  scheduleStatus?: string
): boolean => {
  return auctionTimingStatus === 'active' || 
         (auctionTimingStatus === 'unknown' && normalizeAuctionStatus(scheduleStatus || '') === 'active');
};