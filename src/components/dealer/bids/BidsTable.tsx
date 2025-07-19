
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
  const { cancelBid, isCancelling } = useBidActions(dealerProfile?.id);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<MyBid | null>(null);
  const [isModifying, setIsModifying] = useState(false);

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

  const confirmModifyBid = async (newAmount: number) => {
    if (selectedBid) {
      setIsModifying(true);
      try {
        // For now, we'll implement a simple modify by canceling and re-placing
        // This would need to be implemented as a proper modify function
        console.log('Modifying bid to:', newAmount);
        // TODO: Implement proper bid modification
      } catch (error) {
        console.error('Error modifying bid:', error);
      } finally {
        setIsModifying(false);
      }
    }
  };

  const getAuctionTimingStatus = (bid: MyBid) => {
    return bid.auctionTimingStatus || 'unknown';
  };

  const getAuctionStatusDisplay = (bid: MyBid) => {
    const timingStatus = getAuctionTimingStatus(bid);
    
    switch (timingStatus) {
      case 'running':
        return { text: 'Live Auction', variant: 'default' as const, icon: Clock, className: 'bg-green-100 text-green-800 border-green-300' };
      case 'ended':
        return { text: 'Auction Ended', variant: 'secondary' as const, icon: Clock, className: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 'scheduled':
        return { text: 'Scheduled', variant: 'outline' as const, icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-300' };
      default:
        return null;
    }
  };

  const canModifyBid = (bid: MyBid) => {
    const timingStatus = getAuctionTimingStatus(bid);
    return timingStatus === 'scheduled';
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Your Bid</TableHead>
              <TableHead>Auction Ends</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {bids.map((bid) => {
              const auctionStatusDisplay = getAuctionStatusDisplay(bid);
              const canModify = canModifyBid(bid);
              
              return (
                <TableRow key={bid.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}</div>
                      {auctionStatusDisplay && (
                        <Badge variant={auctionStatusDisplay.variant} className={`mt-1 font-medium ${auctionStatusDisplay.className}`}>
                          <auctionStatusDisplay.icon className="h-3 w-3 mr-1" />
                          {auctionStatusDisplay.text}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{formatCurrency(bid.amount)}</span>
                  </TableCell>
                  <TableCell>
                    {bid.car?.auction_end_time ? (
                      <div className="flex flex-col">
                        <span>{format(new Date(bid.car.auction_end_time), "MMM d, HH:mm")}</span>
                        {getAuctionTimingStatus(bid) === 'scheduled' && (
                          <Badge variant="outline" className="text-xs w-fit mt-1 font-medium border-2 bg-blue-50 text-blue-700 border-blue-300">
                            Scheduled
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
                            title="Modify bid"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBid(bid)}
                            disabled={isCancelling}
                            title="Cancel bid"
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700">
                          {getAuctionTimingStatus(bid) === 'running' ? "Live Auction" 
                           : getAuctionTimingStatus(bid) === 'ended' ? "Auction Ended" 
                           : "No Actions"}
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
