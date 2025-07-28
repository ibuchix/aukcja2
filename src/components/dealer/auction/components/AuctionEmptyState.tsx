
import React from "react";

interface AuctionEmptyStateProps {
  hasFilters: boolean;
  hasSearch: boolean;
}

export const AuctionEmptyState = ({ hasFilters, hasSearch }: AuctionEmptyStateProps) => {
  return (
    <div className="text-center py-8" style={{ color: '#454545' }}>
      {hasFilters || hasSearch
        ? "No auctions match your filters. Try adjusting your criteria."
        : "No active auctions available at this time."}
    </div>
  );
};
