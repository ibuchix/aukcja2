
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface AuctionPaginationProps {
  hasMore: boolean;
  onNext: () => void;
  onPrevious: () => void;
  canGoBack: boolean;
  isLoading?: boolean;
}

export const AuctionPagination = ({ 
  hasMore, 
  onNext, 
  onPrevious,
  canGoBack,
  isLoading
}: AuctionPaginationProps) => {
  if (!hasMore && !canGoBack) return null;

  return (
    <Pagination className="my-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={onPrevious}
            className={canGoBack ? "cursor-pointer" : "pointer-events-none opacity-50"}
            aria-disabled={!canGoBack || isLoading}
          />
        </PaginationItem>
        
        <PaginationItem>
          <PaginationNext 
            onClick={onNext}
            className={hasMore ? "cursor-pointer" : "pointer-events-none opacity-50"}
            aria-disabled={!hasMore || isLoading}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
