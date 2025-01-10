import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      >
        <span className="text-lg font-semibold">My Bids</span>
        <span className="text-sm text-subtitle-text">Manage your active bids</span>
      </Button>
      <Button
        variant="outline"
        className="h-32 flex flex-col items-center justify-center space-y-2"
        onClick={() => navigate('/dealer/profile')}
      >
        <span className="text-lg font-semibold">Profile Settings</span>
        <span className="text-sm text-subtitle-text">Update your information</span>
      </Button>
    </div>
  );
}