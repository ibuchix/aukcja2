
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
import { Edit, X, Clock, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { MyBid } from "./types";
import { CancelBidDialog } from "./CancelBidDialog";
import { ModifyBidDialog } from "./ModifyBidDialog";
import { BidCarDetailsDialog } from "./BidCarDetailsDialog";
import { useBidActions } from "@/hooks/useBidActions";
import { useCurrentDealerProfile } from "@/hooks/useCurrentDealerProfile";
import { translateSpecificationLabel } from "@/lib/vehicleTranslations";

interface BidsTableProps {
  bids: MyBid[];
}

export const BidsTable = ({ bids }: BidsTableProps) => {
  const { dealerProfile } = useCurrentDealerProfile();
  const { placeBid, cancelBid, isSubmitting, isCancelling } = useBidActions(dealerProfile?.id);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<MyBid | null>(null);
  const [isModifying, setIsModifying] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBidForDetails, setSelectedBidForDetails] = useState<MyBid | null>(null);

  const handleCancelBid = (bid: MyBid) => {
    setSelectedBid(bid);
    setCancelDialogOpen(true);
  };

  const handleModifyBid = (bid: MyBid) => {
    setSelectedBid(bid);
    setModifyDialogOpen(true);
  };

  const handleViewDetails = (bid: MyBid) => {
    setSelectedBidForDetails(bid);
    setDetailsDialogOpen(true);
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
    if (!selectedBid || !dealerProfile?.id) return;
    
    setIsModifying(true);
    try {
      const result = await placeBid(selectedBid.car_id, dealerProfile.id, newAmount);
      
      if (result.success) {
        setModifyDialogOpen(false);
        setSelectedBid(null);
        // The bid data will refresh automatically via the query
      }
    } catch (error) {
      console.error('Error modifying bid:', error);
    } finally {
      setIsModifying(false);
    }
  };

  const getAuctionTimingStatus = (bid: MyBid) => {
    return bid.auctionTimingStatus || 'unknown';
  };

  const getAuctionStatusDisplay = (bid: MyBid) => {
    const timingStatus = getAuctionTimingStatus(bid);
    
    switch (timingStatus) {
      case 'active':
        return { text: 'Aukcja na żywo', variant: 'default' as const, icon: Clock, className: 'bg-green-100 text-green-800 border-green-300' };
      case 'ended':
        return { text: 'Aukcja zakończona', variant: 'secondary' as const, icon: Clock, className: 'bg-gray-100 text-gray-800 border-gray-300' };
      case 'scheduled':
        return { text: 'Zaplanowana', variant: 'outline' as const, icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-300' };
      default:
        return null;
    }
  };

  const canModifyBid = (bid: MyBid) => {
    const timingStatus = getAuctionTimingStatus(bid);
    return timingStatus === 'scheduled' || timingStatus === 'active';
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Auto</TableHead>
              <TableHead>Twoja oferta</TableHead>
              <TableHead>Koniec aukcji za</TableHead>
              <TableHead className="text-right">{translateSpecificationLabel('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {bids.map((bid) => {
              const auctionStatusDisplay = getAuctionStatusDisplay(bid);
              const canModify = canModifyBid(bid);
              
              return (
                <TableRow key={bid.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <div className="font-semibold text-base mb-1">
                        {bid.car?.title || `${bid.car?.year} ${bid.car?.make} ${bid.car?.model}`}
                      </div>
                      {auctionStatusDisplay && (
                        <Badge variant={auctionStatusDisplay.variant} className={`w-fit font-medium ${auctionStatusDisplay.className}`}>
                          {auctionStatusDisplay.icon && (() => {
                            const IconComponent = auctionStatusDisplay.icon;
                            return <IconComponent className="h-3 w-3 mr-1" />;
                          })()}
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
                      <div className="text-sm font-medium">
                        {format(new Date(bid.car.auction_end_time), "MMM d, HH:mm")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* View Details Button - Always Available */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(bid)}
                        title="Zobacz szczegóły"
                        className="border-green-500 text-green-600 hover:bg-green-50 bg-green-50/50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {canModify ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModifyBid(bid)}
                            disabled={isModifying || isSubmitting}
                            title="Modyfikuj ofertę"
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBid(bid)}
                            disabled={isCancelling}
                            title="Anuluj ofertę"
                            className="border-red-500 text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-700">
                          {getAuctionTimingStatus(bid) === 'active' ? "Aukcja na żywo" 
                           : getAuctionTimingStatus(bid) === 'ended' ? "Aukcja zakończona" 
                           : "Brak akcji"}
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

      <BidCarDetailsDialog
        isOpen={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        bid={selectedBidForDetails}
      />
    </>
  );
};
