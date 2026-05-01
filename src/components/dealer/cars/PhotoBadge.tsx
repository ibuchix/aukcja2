import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export type BadgeVariant = 
  | "live"
  | "damaged"
  | "registered"
  | "verified-seller"
  | "payment-collection"
  | "instant-purchase"
  | "accident-free"
  | "salon-pl";

export type BadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface PhotoBadgeProps {
  variant: BadgeVariant;
  position: BadgePosition;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  "live": "bg-green-500 text-white animate-pulse",
  "damaged": "bg-[#D81B24] text-white",
  "registered": "bg-blue-500 text-white",
  "verified-seller": "bg-purple-600 text-white",
  "payment-collection": "bg-amber-500 text-white",
  "instant-purchase": "bg-emerald-500 text-white",
  "accident-free": "bg-green-600 text-white border border-white/20",
  "salon-pl": "bg-white text-[#D81B24] border border-[#D81B24]/30",
};

const positionStyles: Record<BadgePosition, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

export const PhotoBadge = ({ variant, position, className, children }: PhotoBadgeProps) => {
  const isMobile = useIsMobile();

  // On mobile, stack bottom badges vertically to prevent overlap
  const getMobilePosition = () => {
    if (!isMobile) return positionStyles[position];
    
    if (position === "bottom-right") {
      return "bottom-12 left-2"; // Stack above bottom-left badge
    }
    return positionStyles[position];
  };

  return (
    <div
      className={cn(
        "absolute z-10 flex items-center gap-1 font-kanit font-semibold rounded-md shadow-lg backdrop-blur-sm",
        isMobile ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1",
        variantStyles[variant],
        getMobilePosition(),
        className
      )}
    >
      {variant === "damaged" && <AlertTriangle className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />}
      {children}
    </div>
  );
};
