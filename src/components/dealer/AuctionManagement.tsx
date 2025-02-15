
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

export const AuctionManagement = ({ dealerId }: { dealerId: string }) => {
  const {
    activeAuctions,
    loadingActive,
    wonAuctions,
    loadingWon,
    lostAuctions,
    loadingLost,
  } = useAuctionQueries(dealerId);

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
              auctions={activeAuctions}
              isLoading={loadingActive}
              dealerId={dealerId}
            />
          </TabsContent>
          <TabsContent value="won" className="mt-4">
            <AuctionTable
              auctions={wonAuctions}
              isLoading={loadingWon}
              dealerId={dealerId}
            />
          </TabsContent>
          <TabsContent value="lost" className="mt-4">
            <AuctionTable
              auctions={lostAuctions}
              isLoading={loadingLost}
              dealerId={dealerId}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
