
import { Bid } from "@/components/auction/bid-history/types";

export interface BidActivity {
  id: string;
  timestamp: string;
  type: 'new_bid' | 'outbid' | 'won' | 'lost' | 'proxy_executed' | 'auction_ended';
  carId: string;
  carTitle: string;
  bidAmount?: number;
  bidId?: string;
  dealerId?: string;
  dealerName?: string;
  auctionEndTime?: string;
  isOwnActivity: boolean;
}

export interface BidMonitoringFilters {
  bidStatus?: string[];
  carMake?: string[];
  searchQuery?: string;
  timeRange?: 'last_hour' | 'today' | 'yesterday' | 'last_week' | 'all';
  activityTypes?: string[];
}

export interface BidMetrics {
  activeBidsCount: number;
  outbidCount: number;
  wonCount: number;
  lostCount: number;
  totalInvested: number;
  potentialExposure: number;
}
