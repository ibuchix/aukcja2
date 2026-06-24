
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gavel, FileText, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export function QuickActions() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // NOTE: "Moje oferty" tile is intentionally hidden for now.
  // Keep the entry below commented so we can re-enable it later if needed.
  const quickActionItems = [
    // {
    //   icon: <Gavel className="h-5 w-5" />,
    //   title: "Moje oferty",
    //   description: "",
    //   link: "/dealer/bids",
    //   variant: "green" as const
    // },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Centrum Dokumentów", 
      description: "",
      link: "/dealer/documents",
      variant: "yellow" as const
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Lista życzeń",
      description: "",
      link: "/dealer/wishlist", 
      variant: "green" as const
    }
  ];

  if (isMobile) {
    return (
      <div className="mb-6">
        <div className="flex justify-center gap-8">
          {quickActionItems.map((item) => (
            <Button
              key={item.title}
              variant="outline"
              size="lg"
              className="w-16 h-16 rounded-full bg-secondary border-2 border-[#D81B24]/40 hover:bg-[#D81B24]/10 transition-all"
              onClick={() => navigate(item.link)}
            >
              <div className="text-[#D81B24]">
                {item.icon}
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 text-body-text">Szybkie działania</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActionItems.map((item) => (
          <ActionButton
            key={item.title}
            icon={item.icon}
            title={item.title}
            description={item.description}
            link={item.link}
            variant={item.variant}
          />
        ))}
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
    green: "bg-secondary border-2 border-[#D81B24]/40 shadow-lg",
    yellow: "bg-secondary border-2 border-[#D81B24]/40 shadow-lg",
    blue: "bg-secondary border-2 border-[#D81B24]/40 shadow-lg"
  };

  const iconColors = {
    green: "text-[#D81B24]",
    yellow: "text-[#D81B24]",
    blue: "text-[#D81B24]"
  };

  const textColors = {
    green: "text-[#D81B24]",
    yellow: "text-[#D81B24]",
    blue: "text-[#D81B24]"
  };

  return (
    <div 
      className={`${variantStyles[variant]} p-4 rounded-lg cursor-pointer hover:shadow-lg transition-all group`}
      onClick={() => navigate(link)}
    >
      <div className="flex items-center">
        <div className="bg-background p-2 rounded-full shadow-sm mr-3 border border-accent/20">
          <div className={iconColors[variant]}>
            {icon}
          </div>
        </div>
        <h3 className="font-medium text-lg text-body-text">{title}</h3>
      </div>
    </div>
  );
}
