
import { useState } from "react";
import { Car, Gavel, Heart, CreditCard, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  DealerCard, 
  StatusBadge, 
  DealerDataTable, 
  MetricCard, 
  EmptyState,
  FilterBar,
  FilterSearch
} from ".";

/**
 * Showcase component to demonstrate dealer UI components
 */
export function DealerUIShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showData, setShowData] = useState(true);

  // Sample data for the table
  const sampleTableData = [
    { 
      id: "1", 
      vehicle: "2019 BMW X5", 
      bidAmount: 35000,
      status: "active",
      endDate: new Date(2023, 11, 25)
    },
    { 
      id: "2", 
      vehicle: "2020 Mercedes E-Class", 
      bidAmount: 42000,
      status: "outbid",
      endDate: new Date(2023, 11, 28)
    },
    { 
      id: "3", 
      vehicle: "2018 Audi Q7", 
      bidAmount: 31500,
      status: "won",
      endDate: new Date(2023, 11, 20)
    }
  ];

  // Table columns definition
  const columns = [
    {
      header: "Vehicle",
      accessorKey: "vehicle"
    },
    {
      header: "Your Bid",
      accessorKey: "bidAmount",
      cell: (row) => `$${row.bidAmount.toLocaleString()}`
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (row) => {
        const statusMap = {
          active: <StatusBadge status="success" text="Active" />,
          outbid: <StatusBadge status="warning" text="Outbid" />,
          won: <StatusBadge status="verified" text="Won" />,
          lost: <StatusBadge status="rejected" text="Lost" />
        };
        return statusMap[row.status as keyof typeof statusMap];
      }
    },
    {
      header: "End Date",
      accessorKey: "endDate",
      cell: (row) => format(row.endDate, "MMM d, yyyy")
    },
    {
      header: "Actions",
      accessorKey: (row) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">View</Button>
          <Button variant="outline" size="sm">Bid</Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Dealer UI Component Showcase</h2>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
          title="Active Bids" 
          value="12" 
          icon={<Gavel className="h-4 w-4" />}
          change={{ value: 8.5, isPositive: true }}
          color="primary"
        />
        <MetricCard 
          title="Watchlist Items" 
          value="24" 
          icon={<Heart className="h-4 w-4" />}
          color="info"
        />
        <MetricCard 
          title="Total Invested" 
          value="$145,500" 
          icon={<CreditCard className="h-4 w-4" />}
          change={{ value: 12.3, isPositive: true }}
          color="success"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        showClear={!!searchQuery}
        onClear={() => setSearchQuery("")}
        searchComponent={
          <FilterSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search vehicles..."
          />
        }
      >
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </FilterBar>

      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DealerCard 
          title="Recent Bids" 
          description="Your most recent bidding activity"
          icon={<Gavel className="h-5 w-5" />}
          footer={
            <div className="flex justify-end">
              <Button variant="outline" size="sm">View All</Button>
            </div>
          }
        >
          <DealerDataTable
            columns={columns}
            data={showData ? sampleTableData : []}
            isLoading={false}
            emptyState={
              <EmptyState
                icon={<Gavel className="h-8 w-8 text-muted-foreground" />}
                title="No bids found"
                description="You haven't placed any bids yet. Start bidding to see your activity here."
                action={{
                  label: "Browse Auctions",
                  onClick: () => console.log("Browse auctions")
                }}
              />
            }
            keyExtractor={(row) => row.id}
          />
        </DealerCard>

        <DealerCard 
          title="Watchlist" 
          description="Vehicles you're interested in"
          icon={<Heart className="h-5 w-5" />}
          variant="highlight"
          footer={
            <div className="flex justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowData(!showData)}
              >
                {showData ? "Show Empty State" : "Show Data"}
              </Button>
              <Button variant="outline" size="sm">Manage Watchlist</Button>
            </div>
          }
        >
          {showData ? (
            <div className="space-y-4">
              {sampleTableData.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{item.vehicle}</div>
                    <div className="text-sm text-muted-foreground">
                      Ends: {format(item.endDate, "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button size="sm">Bid Now</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Car className="h-8 w-8 text-muted-foreground" />}
              title="Your watchlist is empty"
              description="Add vehicles to your watchlist to keep track of auctions you're interested in."
              action={{
                label: "Browse Vehicles",
                onClick: () => console.log("Browse vehicles")
              }}
            />
          )}
        </DealerCard>
      </div>

      {/* Status Badges */}
      <DealerCard title="Status Indicators">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Default Size</div>
            <div className="flex space-x-2">
              <StatusBadge status="verified" />
              <StatusBadge status="pending" />
              <StatusBadge status="rejected" />
              <StatusBadge status="warning" />
              <StatusBadge status="success" />
              <StatusBadge status="error" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Small Size</div>
            <div className="flex space-x-2">
              <StatusBadge status="verified" size="sm" />
              <StatusBadge status="pending" size="sm" />
              <StatusBadge status="rejected" size="sm" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Large Size</div>
            <div className="flex space-x-2">
              <StatusBadge status="verified" size="lg" />
              <StatusBadge status="pending" size="lg" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom Text</div>
            <div className="flex space-x-2">
              <StatusBadge status="verified" text="Payment Verified" />
              <StatusBadge status="warning" text="Action Required" />
            </div>
          </div>
        </div>
      </DealerCard>
    </div>
  );
}
