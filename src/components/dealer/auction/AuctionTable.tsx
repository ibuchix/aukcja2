
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuctionTableProps } from "./types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";

import { useIsMobile } from "@/hooks/useIsMobile";
import { AuctionScheduleInfo } from "@/components/auction/AuctionScheduleInfo";
import { formatUKDateTime } from "@/utils/ukTimeUtils";

export const AuctionTable = ({ auctions, isLoading, dealerId }: AuctionTableProps) => {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return <div className="text-muted-foreground">Loading auctions...</div>;
  }

  if (!auctions?.length) {
    return <div className="text-muted-foreground">No auctions found.</div>;
  }

  // Mobile-optimized view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {auctions.map((auction) => (
          <div key={auction.id} className="bg-white p-3 rounded-md border shadow-sm">
            <div className="font-medium text-lg mb-2">{auction.title}</div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <div className="text-muted-foreground">End Time</div>
                <div>{formatUKDateTime(auction.auction_end_time)}</div>
              </div>
              
              <div>
                <div className="text-muted-foreground">Reserve Price</div>
                <div>${auction.reserve_price.toLocaleString()}</div>
              </div>
              
              <div>
                <div className="text-muted-foreground">Highest Bid</div>
                <div className={auction.highest_bid?.dealer_id === dealerId ? "text-success font-medium" : ""}>
                  {auction.highest_bid 
                    ? `$${auction.highest_bid.amount.toLocaleString()}` 
                    : "No bids"}
                </div>
              </div>
              
              <div>
                <div className="text-muted-foreground">My Bid</div>
                <div className={auction.my_bid?.status === "winning" ? "text-success font-medium" : ""}>
                  {auction.my_bid 
                    ? `$${auction.my_bid.amount.toLocaleString()}` 
                    : "No bid"}
                </div>
              </div>
            </div>
            
            <div className="mb-2">
              <AuctionScheduleInfo
                scheduleStatus={auction.schedule_status}
                scheduleStartTime={auction.schedule_start_time}
                scheduleEndTime={auction.schedule_end_time}
                auctionTimingStatus={auction.auctionTimingStatus}
              />
              {auction.timeDisplay && (
                <div className={`text-sm font-medium ${
                  auction.auctionTimingStatus === 'active' ? 'text-orange-600' :
                  auction.auctionTimingStatus === 'scheduled' ? 'text-blue-600' :
                  'text-muted-foreground'
                }`}>
                  {auction.timeDisplay}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 mt-3">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link to={`/auctions/${auction.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop table view
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
          <TableRow key={auction.id} className="hover:bg-muted/50">
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">
                  {auction.year} {auction.make} {auction.model}
                </div>
                <div className="text-sm text-muted-foreground">
                  {auction.title}
                </div>
                <div className="space-y-1">
                  <AuctionScheduleInfo
                    scheduleStatus={auction.schedule_status}
                    scheduleStartTime={auction.schedule_start_time}
                    scheduleEndTime={auction.schedule_end_time}
                    auctionTimingStatus={auction.auctionTimingStatus}
                  />
                  {auction.timeDisplay && (
                    <div className={`text-sm font-medium ${
                      auction.auctionTimingStatus === 'active' ? 'text-orange-600' :
                      auction.auctionTimingStatus === 'scheduled' ? 'text-blue-600' :
                      'text-muted-foreground'
                    }`}>
                      {auction.timeDisplay}
                    </div>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {formatUKDateTime(auction.auction_end_time)}
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
            <TableCell>
              <div className="space-y-1">
                <div className={`font-medium capitalize ${
                  auction.auctionTimingStatus === 'active' ? 'text-green-600' :
                  auction.auctionTimingStatus === 'scheduled' ? 'text-blue-600' :
                  auction.auctionTimingStatus === 'ended' ? 'text-gray-600' :
                  'text-muted-foreground'
                }`}>
                  {auction.auctionTimingStatus === 'active' ? 'Live Auction' :
                   auction.auctionTimingStatus === 'scheduled' ? 'Starting Soon' :
                   auction.auctionTimingStatus === 'ended' ? 'Auction Ended' :
                   auction.auction_status}
                </div>
                {auction.biddingAllowed === false && auction.auctionTimingStatus === 'scheduled' && (
                  <div className="text-xs text-muted-foreground">
                    Bidding not yet available
                  </div>
                )}
                {auction.lost_by && (
                  <div className="text-sm text-muted-foreground">
                    Lost by ${auction.lost_by.toLocaleString()}
                  </div>
                )}
                {auction.reserve_met && auction.auctionTimingStatus === 'active' && (
                  <div className="text-xs text-green-600 font-medium">
                    Reserve met
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/auctions/${auction.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
