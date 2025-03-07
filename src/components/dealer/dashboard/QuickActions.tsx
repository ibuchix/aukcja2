
import { Button } from "@/components/ui/button";
import { Car, DollarSign, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Button 
        className="flex items-center justify-center space-x-2 h-16"
        onClick={() => navigate('/marketplace')}
      >
        <Car className="w-5 h-5" />
        <span>Browse Vehicles</span>
      </Button>
      <Button 
        className="flex items-center justify-center space-x-2 h-16"
        onClick={() => navigate('/dealer/bids')}
        variant="secondary"
      >
        <DollarSign className="w-5 h-5" />
        <span>View My Bids</span>
      </Button>
      <Button 
        className="flex items-center justify-center space-x-2 h-16"
        onClick={() => navigate('/dealer/documents')}
        variant="outline"
      >
        <FileText className="w-5 h-5" />
        <span>Manage Documents</span>
      </Button>
    </div>
  );
};
