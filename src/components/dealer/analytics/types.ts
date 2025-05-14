
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
}
