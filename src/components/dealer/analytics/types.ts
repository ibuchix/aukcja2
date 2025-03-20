
export interface BidAnalyticsData {
  totalBids: number;
  successfulBids: number;
  outbidCount: number;
  averageBidAmount: number;
  highestBid: number;
  successRate: number;
  marketComparison: {
    averageBidAmount: number;
    successRate: number;
  };
  bidOverTime: {
    date: string;
    count: number;
    amount: number;
  }[];
  bidsByStatus: {
    status: string;
    count: number;
  }[];
  bidsByCarType: {
    carType: string;
    count: number;
    successRate: number;
  }[];
}

export interface BidAnalyticsFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
  carTypes?: string[];
  includePending?: boolean;
}
