
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gavel, FileText } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  variant: 'green' | 'yellow';
}

function ActionButton({ icon, title, description, link, variant }: ActionButtonProps) {
  const navigate = useNavigate();

  const variantStyles = {
    green: "bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200",
    yellow: "bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200"
  };

  const iconColors = {
    green: "text-success",
    yellow: "text-yellow-600"
  };

  const textColors = {
    green: "text-success",
    yellow: "text-yellow-600"
  };

  return (
    <div 
      className={`${variantStyles[variant]} p-5 rounded-lg cursor-pointer hover:shadow-md transition-all group`}
      onClick={() => navigate(link)}
    >
      <div className="flex items-center mb-3">
        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
          <div className={iconColors[variant]}>
            {icon}
          </div>
        </div>
        <h3 className="font-medium text-lg">{title}</h3>
      </div>
      <p className="text-subtitle-text mb-3">{description}</p>
      <span className={`${textColors[variant]} font-medium group-hover:underline`}>
        {title === "My Bids" ? "View My Bids" : "Manage Documents"} →
      </span>
    </div>
  );
}
