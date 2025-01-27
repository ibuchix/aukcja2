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
import { useAuctions } from "./auction/useAuctions";
import { AuctionResultsCard } from "./auction/AuctionResultsCard";

export const SellerAuctionManagement = ({ sellerId }: { sellerId: string }) => {
  const { data: activeAuctions, isLoading: loadingActive } = useAuctions(sellerId, 'active');
  const { data: completedAuctions, isLoading: loadingCompleted } = useAuctions(sellerId, 'completed');

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
            <TabsTrigger value="completed">Completed Auctions</TabsTrigger>
            <TabsTrigger value="results">Results & Analytics</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <AuctionTable auctions={activeAuctions} isLoading={loadingActive} />
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            <AuctionTable auctions={completedAuctions} isLoading={loadingCompleted} />
          </TabsContent>
          <TabsContent value="results" className="mt-4">
            <AuctionResultsCard sellerId={sellerId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};