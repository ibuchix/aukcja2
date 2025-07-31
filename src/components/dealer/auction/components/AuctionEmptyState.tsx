
import React from "react";

interface AuctionEmptyStateProps {
  hasFilters: boolean;
  hasSearch: boolean;
}

export const AuctionEmptyState = ({ hasFilters, hasSearch }: AuctionEmptyStateProps) => {
  return (
    <div className="text-center py-8" style={{ color: '#454545' }}>
      {hasFilters || hasSearch
        ? "Żadne aukcje nie pasują do Twoich filtrów. Spróbuj dostosować kryteria."
        : "W tej chwili brak dostępnych aukcji."}
    </div>
  );
};
