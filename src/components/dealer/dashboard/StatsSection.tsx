
import { Card, CardContent } from "@/components/ui/card";
import { GavelIcon, ShoppingCart, Car, Clock, Loader2 } from "lucide-react";
import { useDealerStats } from "@/hooks/useDealerStats";

export const StatsSection = () => {
  const { activeBids, wonAuctions, availableAuctions, watchlist, loading, error } = useDealerStats();

  const stats = [
    {
      title: "Active Bids",
      value: loading ? "..." : activeBids.toString(),
      icon: <GavelIcon className="h-5 w-5 text-blue-500" />,
      description: "Current active bids"
    },
    {
      title: "Won Auctions",
      value: loading ? "..." : wonAuctions.toString(),
      icon: <ShoppingCart className="h-5 w-5 text-green-500" />,
      description: "Successfully won"
    },
    {
      title: "Available Auctions",
      value: loading ? "..." : availableAuctions.toString(),
      icon: <Car className="h-5 w-5 text-purple-500" />,
      description: "Ready to bid"
    },
    {
      title: "Watchlist",
      value: loading ? "..." : watchlist.toString(),
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      description: "Vehicles you're watching"
    }
  ];

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border-none col-span-full">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>Failed to load statistics</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white shadow-sm border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
              <div className="p-2 bg-gray-50 rounded-md">
                {stat.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
