import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gavel, ActivitySquare } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Button
        variant="outline"
        className="h-32 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate('/marketplace')}
      >
        <span className="text-lg font-semibold">Browse Listings</span>
        <span className="text-sm text-subtitle-text">View available vehicles</span>
      </Button>
      <Button
        variant="outline"
        className="h-32 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate('/dealer/documents')}
      >
        <span className="text-lg font-semibold">Manage Documents</span>
        <span className="text-sm text-subtitle-text">View uploaded files</span>
      </Button>
      <ActionButton
        icon={<ActivitySquare className="h-5 w-5" />}
        title="Bid Monitoring"
        description="Track your bidding activity"
        link="/dealer/bid-monitoring"
      />
    </div>
  );
}

function ActionButton({ icon, title, description, link }) {
  return (
    <Button
      variant="outline"
      className="h-32 flex flex-col items-center justify-center space-y-2"
      onClick={() => navigate(link)}
    >
      {icon}
      <span className="text-lg font-semibold">{title}</span>
      <span className="text-sm text-subtitle-text">{description}</span>
    </Button>
  );
}
