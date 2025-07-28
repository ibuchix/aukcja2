
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gavel, FileText, Trophy } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 text-body-text">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionButton
          icon={<Gavel className="h-5 w-5" />}
          title="My Bids"
          description="Track your bidding activity"
          link="/dealer/bids"
          variant="green"
        />
        <ActionButton
          icon={<FileText className="h-5 w-5" />}
          title="Manage Documents"
          description="View uploaded files"
          link="/dealer/documents"
          variant="yellow"
        />
        <ActionButton
          icon={<Trophy className="h-5 w-5" />}
          title="Won Vehicles"
          description="View your auction wins"
          link="/dealer/won-vehicles"
          variant="blue"
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  variant: 'green' | 'yellow' | 'blue';
}

function ActionButton({ icon, title, description, link, variant }: ActionButtonProps) {
  const navigate = useNavigate();

  const variantStyles = {
    green: "bg-card border-2 border-green-500/30 shadow-sm",
    yellow: "bg-card border-2 border-yellow-500/30 shadow-sm",
    blue: "bg-card border-2 border-blue-500/30 shadow-sm"
  };

  const iconColors = {
    green: "text-success",
    yellow: "text-yellow-600",
    blue: "text-blue-600"
  };

  const textColors = {
    green: "text-success",
    yellow: "text-yellow-600",
    blue: "text-blue-600"
  };

  return (
    <div 
      className={`${variantStyles[variant]} p-5 rounded-lg cursor-pointer hover:shadow-lg transition-all group`}
      onClick={() => navigate(link)}
    >
      <div className="flex items-center mb-3">
        <div className="bg-background p-2 rounded-full shadow-sm mr-3 border border-border">
          <div className={iconColors[variant]}>
            {icon}
          </div>
        </div>
        <h3 className="font-medium text-lg text-body-text">{title}</h3>
      </div>
      <p className="text-subtitle-text mb-3">{description}</p>
      <span className={`${textColors[variant]} font-medium group-hover:underline`}>
        {title === "My Bids" ? "View My Bids" : 
         title === "Won Vehicles" ? "View Won Vehicles" : 
         "Manage Documents"} →
      </span>
    </div>
  );
}
