
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Auction } from "./types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { AuctionWatchlistButton } from "@/components/auction/AuctionWatchlistButton";

interface AuctionTableProps {
  auctions: Auction[] | undefined;
  isLoading: boolean;
  dealerId: string;
}

export const AuctionTable = ({ auctions, isLoading, dealerId }: AuctionTableProps) => {
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
          <TableHead>End Time</TableHead>
          <TableHead>Reserve Price</TableHead>
          <TableHead>Highest Bid</TableHead>
          <TableHead>My Bid</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auctions.map((auction) => (
          <TableRow key={auction.id}>
            <TableCell>{auction.title}</TableCell>
            <TableCell>
              {format(new Date(auction.auction_end_time), "MMM d, yyyy HH:mm")}
            </TableCell>
            <TableCell>${auction.reserve_price.toLocaleString()}</TableCell>
            <TableCell>
              {auction.highest_bid ? (
                <span className={auction.highest_bid.dealer_id === dealerId ? "text-success font-medium" : ""}>
                  ${auction.highest_bid.amount.toLocaleString()}
                </span>
              ) : (
                "No bids"
              )}
            </TableCell>
            <TableCell>
              {auction.my_bid ? (
                <span className={auction.my_bid.status === "winning" ? "text-success font-medium" : ""}>
                  ${auction.my_bid.amount.toLocaleString()}
                </span>
              ) : (
                "No bid"
              )}
            </TableCell>
            <TableCell className="capitalize">
              {auction.auction_status === "sold" ? (
                <span className="text-success font-medium">Sold</span>
              ) : auction.auction_status === "reserve_not_met" ? (
                <span className="text-destructive font-medium">Reserve not met</span>
              ) : (
                auction.auction_status
              )}
              {auction.lost_by && (
                <div className="text-sm text-muted-foreground">
                  Lost by ${auction.lost_by.toLocaleString()}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/auctions/${auction.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
                <AuctionWatchlistButton
                  carId={auction.id}
                  dealerId={dealerId}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
