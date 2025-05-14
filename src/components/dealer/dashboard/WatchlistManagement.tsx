
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, List } from "lucide-react";

interface WatchlistManagementProps {
  dealerId: string;
}

export const WatchlistManagement = ({ dealerId }: WatchlistManagementProps) => {
  if (!dealerId) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">
          <Eye className="h-4 w-4 inline mr-2" />
          Watchlist
        </CardTitle>
        <Link to="/dealer/watchlist">
          <Button variant="ghost" size="sm">
            <List className="mr-2 h-4 w-4" />
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Cars you're watching will appear here. Add cars to your watchlist to track their auction progress.
        </p>
        <div className="mt-4">
          <Link to="/marketplace">
            <Button variant="outline" size="sm">
              Browse Cars
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
