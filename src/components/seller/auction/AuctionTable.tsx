import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { AuctionFormat } from "@/types/cars";

interface Auction {
  id: string;
  title: string;
  auction_end_time: string;
  auction_status: string;
  reserve_price: number;
  auction_format: AuctionFormat;
  extensions_used: number;
  max_extensions_allowed: number;
  highest_bid?: {
    amount: number;
    dealer: {
      dealership_name: string;
    };
  };
  total_bids: number;
  unique_bidders: number;
}

interface AuctionTableProps {
  auctions: Auction[] | undefined;
  isLoading: boolean;
}

export const AuctionTable = ({ auctions, isLoading }: AuctionTableProps) => {
  if (isLoading) {
    return <div className="text-muted-foreground">Loading auctions...</div>;
  }

  if (!auctions?.length) {
    return <div className="text-muted-foreground">No auctions found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Time Remaining</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Extensions</TableHead>
          <TableHead>Reserve Price</TableHead>
          <TableHead>Highest Bid</TableHead>
          <TableHead>Total Bids</TableHead>
          <TableHead>Unique Bidders</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auctions.map((auction) => (
          <TableRow key={auction.id}>
            <TableCell>{auction.title}</TableCell>
            <TableCell>
              <AuctionTimer 
                auctionEndTime={auction.auction_end_time}
                auctionFormat={auction.auction_format}
                extensionsUsed={auction.extensions_used}
                maxExtensionsAllowed={auction.max_extensions_allowed}
              />
            </TableCell>
            <TableCell className="capitalize">
              {auction.auction_format}
            </TableCell>
            <TableCell>
              {auction.auction_format === 'extended' ? (
                <div className="space-y-1">
                  <div>{auction.extensions_used}/{auction.max_extensions_allowed} used</div>
                  {auction.extensions_used < auction.max_extensions_allowed && (
                    <div className="text-sm text-muted-foreground">
                      Extensions available
                    </div>
                  )}
                </div>
              ) : (
                'N/A'
              )}
            </TableCell>
            <TableCell>${auction.reserve_price.toLocaleString()}</TableCell>
            <TableCell>
              {auction.highest_bid ? (
                <div className="space-y-1">
                  <div>${auction.highest_bid.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">
                    by {auction.highest_bid.dealer.dealership_name}
                  </div>
                </div>
              ) : (
                "No bids"
              )}
            </TableCell>
            <TableCell>{auction.total_bids}</TableCell>
            <TableCell>{auction.unique_bidders}</TableCell>
            <TableCell className="capitalize">
              {auction.auction_status === "sold" ? (
                <span className="text-success font-medium">Sold</span>
              ) : auction.auction_status === "reserve_not_met" ? (
                <span className="text-destructive font-medium">Reserve not met</span>
              ) : (
                auction.auction_status
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};