
import { BadgeCheck, AlertTriangle, Clock, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "verified" | "pending" | "rejected" | "warning" | "success" | "error";

interface StatusBadgeProps {
  status: StatusType;
  text?: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Reusable badge for displaying status information
 */
export function StatusBadge({ 
  status, 
  text, 
  className,
  showIcon = true,
  size = "md" 
}: StatusBadgeProps) {
  const statusConfig = {
    verified: { 
      icon: BadgeCheck, 
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      defaultText: "Verified"
    },
    pending: {
      icon: Clock,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      defaultText: "Pending"
    },
    rejected: {
      icon: Ban,
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      defaultText: "Rejected"
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-amber-100",
      textColor: "text-amber-800",
      defaultText: "Warning"
    },
    success: {
      icon: BadgeCheck,
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      defaultText: "Success"
    },
    error: {
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      defaultText: "Error"
    }
  };

  const { icon: Icon, bgColor, textColor, defaultText } = statusConfig[status];
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };

  return (
    <span className={cn(
      "rounded-full flex items-center font-medium", 
      bgColor, 
      textColor,
      sizeClasses[size],
      className
    )}>
      {showIcon && <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5")} />}
      {text || defaultText}
    </span>
  );
}
