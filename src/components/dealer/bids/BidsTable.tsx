
import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, X, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MyBid } from "./types";
import { CancelBidDialog } from "./CancelBidDialog";
import { ModifyBidDialog } from "./ModifyBidDialog";
import { useBidActions } from "@/hooks/useBidActions";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";

interface BidsTableProps {
  bids: MyBid[];
}

export const BidsTable = ({ bids }: BidsTableProps) => {
  const { dealerProfile } = useCurrentDealerProfile();
  const { cancelBid, modifyBid, isCancelling, isModifying } = useBidActions(dealerProfile?.id);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<MyBid | null>(null);

  const handleCancelBid = (bid: MyBid) => {
    setSelectedBid(bid);
    setCancelDialogOpen(true);
  };

  const handleModifyBid = (bid: MyBid) => {
    setSelectedBid(bid);
    setModifyDialogOpen(true);
  };

  const confirmCancelBid = () => {
    if (selectedBid) {
      cancelBid({
        carId: selectedBid.car_id,
        bidId: selectedBid.id,
      });
    }
    setCancelDialogOpen(false);
    setSelectedBid(null);
  };

  const confirmModifyBid = (newAmount: number, isProxyBid: boolean, maxProxyAmount?: number) => {
    if (selectedBid) {
      modifyBid({
        carId: selectedBid.car_id,
        bidId: selectedBid.id,
        newAmount,
        isProxyBid,
        maxProxyAmount,
      });
    }
  };

  // Check if auction has started - bids can only be modified before auction starts
  const hasAuctionStarted = (bid: MyBid) => {
    if (!bid.car?.auction_end_time) return false;
    const auctionEndTime = new Date(bid.car.auction_end_time);
    const now = new Date();
    // Auction has started if we're within 24 hours of the end time and status is active
    return (auctionEndTime.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000) && 
           bid.car.auction_status === 'active';
  };

  const isAuctionEnded = (bid: MyBid) => {
    if (!bid.car?.auction_end_time) return false;
    return new Date(bid.car.auction_end_time) <= new Date();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Your Bid</TableHead>
              <TableHead>Current Bid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Auction Ends</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bids.map((bid) => {
              const auctionStarted = hasAuctionStarted(bid);
              const auctionEnded = isAuctionEnded(bid);
              const canModify = !auctionStarted && !auctionEnded;
              
              return (
                <TableRow key={bid.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}</div>
                      {auctionEnded && (
                        <Badge variant="secondary" className="mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Auction Ended
                        </Badge>
                      )}
                      {auctionStarted && !auctionEnded && (
                        <Badge variant="default" className="mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Auction Active
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{formatCurrency(bid.amount)}</span>
                      {bid.proxy_bid && (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            Proxy
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Max: {formatCurrency(bid.proxy_bid.max_bid_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(bid.car?.current_bid || 0)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={bid.status === 'active' ? 'default' : 'destructive'}
                      className={bid.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {bid.status === 'active' ? 'Highest' : 'Outbid'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {bid.car?.auction_end_time ? (
                      <div className="flex flex-col">
                        <span>{format(new Date(bid.car.auction_end_time), "MMM d, HH:mm")}</span>
                        {!auctionEnded && !auctionStarted && (
                          <Badge variant="outline" className="text-xs w-fit mt-1">
                            Pending
                          </Badge>
                        )}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canModify ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModifyBid(bid)}
                            disabled={isModifying}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBid(bid)}
                            disabled={isCancelling}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {auctionStarted ? "Auction Started" : auctionEnded ? "Auction Ended" : "No Actions Available"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CancelBidDialog
        isOpen={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        bid={selectedBid}
        onConfirm={confirmCancelBid}
        isLoading={isCancelling}
      />

      <ModifyBidDialog
        isOpen={modifyDialogOpen}
        onOpenChange={setModifyDialogOpen}
        bid={selectedBid}
        onConfirm={confirmModifyBid}
        isLoading={isModifying}
      />
    </>
  );
};
