
export interface DealerMetric {
  totalBids: number;
  successfulBids: number;
  activeBids: number;
  totalSpent: number;
  successRate: number;
  averageBidAmount: number;
  bidsByDay: Array<{
    date: string;
    count: number;
  }>;
  bidsByAmount: Array<{
    range: string;
    count: number;
  }>;
  bidsByStatus: {
    won: number;
    active: number;
    lost: number;
    pending: number;
  };
  bidsByCarType: Array<{
    carType: string;
    count: number;
    successRate: number;
  }>;
  bidOverTime: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  outbidCount: number;
  marketComparison: {
    averageBidAmount: number;
    successRate: number;
  };
}

export interface BidAnalyticsData {
  totalBids: number;
  successfulBids: number;
  activeBids: number;
  totalSpent: number;
  successRate: number;
  averageBidAmount: number;
  bidsByDay: Array<{
    date: string;
    count: number;
  }>;
  bidsByAmount: Array<{
    range: string;
    count: number;
  }>;
  bidsByStatus: {
    won: number;
    active: number;
    lost: number;
    pending: number;
  };
  bidsByCarType: Array<{
    carType: string;
    count: number;
    successRate: number;
  }>;
  bidOverTime: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  outbidCount: number;
  marketComparison: {
    averageBidAmount: number;
    successRate: number;
  };
}

export type BidAnalyticsFilters = {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'all';
};
