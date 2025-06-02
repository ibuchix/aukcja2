
import { Button } from "@/components/ui/button";
import { Car, DollarSign, FileText, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickActions = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-lg cursor-pointer hover:shadow-md transition-all group"
          onClick={() => navigate('/dealer/dashboard')}
        >
          <div className="flex items-center mb-3">
            <div className="bg-white p-2 rounded-full shadow-sm mr-3">
              <Car className="w-6 h-6 text-iris" />
            </div>
            <h3 className="font-medium text-lg">Dashboard</h3>
          </div>
          <p className="text-subtitle-text mb-3">Return to your main dealer dashboard</p>
          <span className="text-iris font-medium group-hover:underline">View Dashboard →</span>
        </div>
        
        <div 
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-lg cursor-pointer hover:shadow-md transition-all group border-2 border-purple-200"
          onClick={() => {
            navigate('/dealer/dashboard');
            // Set cars tab as active using URL parameters or state
            const tabChangeEvent = new CustomEvent('set-dashboard-tab', { 
              detail: { tab: 'cars' }
            });
            window.dispatchEvent(tabChangeEvent);
          }}
        >
          <div className="flex items-center mb-3">
            <div className="bg-white p-2 rounded-full shadow-sm mr-3">
              <Search className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="font-medium text-lg">Car Search</h3>
          </div>
          <p className="text-subtitle-text mb-3">Browse all available vehicles directly from your dashboard</p>
          <span className="text-purple-500 font-medium group-hover:underline">Search Cars →</span>
        </div>
        
        <div 
          className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-lg cursor-pointer hover:shadow-md transition-all group"
          onClick={() => navigate('/dealer/bids')}
        >
          <div className="flex items-center mb-3">
            <div className="bg-white p-2 rounded-full shadow-sm mr-3">
              <DollarSign className="w-6 h-6 text-success" />
            </div>
            <h3 className="font-medium text-lg">My Bids</h3>
          </div>
          <p className="text-subtitle-text mb-3">Track and manage your active bidding activity</p>
          <span className="text-success font-medium group-hover:underline">View My Bids →</span>
        </div>
      </div>
    </div>
  );
};
