
import { useNavigate } from "react-router-dom";
import { Building2, DollarSign, History, Bell, MessageSquare, Settings } from "lucide-react";

export const BusinessActionSection = () => {
  const navigate = useNavigate();
  
  const actionItems = [
    {
      title: "Active Bids",
      description: "Track and manage your current vehicle bids",
      icon: DollarSign,
      iconColor: "text-primary",
      path: "/dealer/active-bids"
    },
    {
      title: "Transaction History",
      description: "View your past transactions and purchases",
      icon: History,
      iconColor: "text-blue-500",
      path: "/dealer/transactions"
    },
    {
      title: "Notifications",
      description: "Stay updated with important alerts",
      icon: Bell,
      iconColor: "text-amber-500",
      path: "/dealer/notifications"
    },
    {
      title: "Business Information",
      description: "Manage your dealership details",
      icon: Building2,
      iconColor: "text-emerald-500",
      path: "/dealer/business-info"
    },
    {
      title: "Messages",
      description: "Communicate with sellers and buyers",
      icon: MessageSquare,
      iconColor: "text-indigo-500",
      path: "/dealer/messages"
    },
    {
      title: "Settings",
      description: "Configure your account preferences",
      icon: Settings,
      iconColor: "text-gray-500",
      path: "/dealer/settings"
    }
  ];

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-6">Business Management</h2>
      
      <div className="border-t border-gray-200">
        {actionItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div 
              key={index}
              className="py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(item.path)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-full shadow-sm mr-4">
                    <Icon className={`w-5 h-5 ${item.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-subtitle-text text-sm">{item.description}</p>
                  </div>
                </div>
                <span className="text-iris">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
