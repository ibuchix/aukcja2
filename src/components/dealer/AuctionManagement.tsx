
import { Gavel, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuctionTable } from "./auction/AuctionTable";
import { useAuctionQueries } from "./auction/useAuctionQueries";
import { Auction } from "./auction/types";

interface AuctionManagementProps {
  dealerId: string;
}

export const AuctionManagement = ({ dealerId }: AuctionManagementProps) => {
  const {
    activeAuctions,
    loadingActive,
    wonAuctions,
    loadingWon,
    lostAuctions,
    loadingLost,
  } = useAuctionQueries(dealerId);

  // Type-safe conversion with fallback to empty array
  const safeActiveAuctions: Auction[] = Array.isArray(activeAuctions) 
    ? activeAuctions.filter((auction: any): auction is Auction => {
        // Check if this is a valid auction object and not a SelectQueryError
        return auction && 
               typeof auction === 'object' && 
               !('error' in auction) &&
               'id' in auction &&
               typeof auction.id === 'string';
      })
    : [];

  const safeWonAuctions: Auction[] = Array.isArray(wonAuctions) 
    ? wonAuctions.filter((auction: any): auction is Auction => {
        return auction && 
               typeof auction === 'object' && 
               !('error' in auction) &&
               'id' in auction &&
               typeof auction.id === 'string';
      })
    : [];

  const safeLostAuctions: Auction[] = Array.isArray(lostAuctions) 
    ? lostAuctions.filter((auction: any): auction is Auction => {
        return auction && 
               typeof auction === 'object' && 
               !('error' in auction) &&
               'id' in auction &&
               typeof auction.id === 'string';
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-oswald flex items-center gap-2">
          <Gavel className="h-6 w-6" />
          Auction Management
        </CardTitle>
        <CardDescription>
          Monitor your active auctions and view auction results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Active Auctions
            </TabsTrigger>
            <TabsTrigger value="won">Won Auctions</TabsTrigger>
            <TabsTrigger value="lost">Lost Auctions</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <AuctionTable
              auctions={safeActiveAuctions}
              isLoading={loadingActive}
              dealerId={dealerId}
            />
          </TabsContent>
          <TabsContent value="won" className="mt-4">
            <AuctionTable
              auctions={safeWonAuctions}
              isLoading={loadingWon}
              dealerId={dealerId}
            />
          </TabsContent>
          <TabsContent value="lost" className="mt-4">
            <AuctionTable
              auctions={safeLostAuctions}
              isLoading={loadingLost}
              dealerId={dealerId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
