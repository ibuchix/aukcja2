
import { Card, CardContent } from "@/components/ui/card";
import { GavelIcon, ShoppingCart, Car } from "lucide-react";
import { useDealerStats } from "@/hooks/useDealerStats";

export const StatsSection = () => {
  const { activeBids, wonAuctions, availableAuctions, loading, error } = useDealerStats();

  const stats = [
    {
      title: "Active Bids",
      value: loading ? "..." : activeBids.toString(),
      icon: <GavelIcon className="h-5 w-5 text-iris" />,
      description: "Current active bids"
    },
    {
      title: "Won Auctions",
      value: loading ? "..." : wonAuctions.toString(),
      icon: <ShoppingCart className="h-5 w-5 text-success" />,
      description: "Successfully won"
    },
    {
      title: "Available Auctions",
      value: loading ? "..." : availableAuctions.toString(),
      icon: <Car className="h-5 w-5 text-primary" />,
      description: "Ready to bid"
    },
  ];

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-secondary shadow-lg border border-accent/20 col-span-full">
          <CardContent className="pt-6">
            <div className="text-center text-primary">
              <p className="text-body-text">Failed to load statistics</p>
              <p className="text-sm text-subtitle-text">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-secondary shadow-lg border border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-subtitle-text">{stat.title}</h3>
              <div className="p-2 bg-background rounded-md border border-accent/20">
                {stat.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-body-text">{stat.value}</p>
              <p className="text-xs text-subtitle-text">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
