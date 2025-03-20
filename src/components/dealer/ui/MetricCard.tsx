
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  trend?: ReactNode;
  footer?: ReactNode;
  color?: "default" | "primary" | "success" | "warning" | "danger" | "info";
}

/**
 * Reusable metric display card for analytics and dashboards
 */
export function MetricCard({ 
  title, 
  value, 
  icon, 
  change, 
  className,
  trend,
  footer,
  color = "default"
}: MetricCardProps) {
  const colorClasses = {
    default: "",
    primary: "text-primary",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    info: "text-blue-600"
  };
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center">
              {icon && <span className="mr-2">{icon}</span>}
              {title}
            </h3>
            {change && (
              <span className={cn(
                "text-xs font-medium",
                change.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {change.isPositive ? "↑" : "↓"} {Math.abs(change.value).toFixed(1)}%
              </span>
            )}
          </div>
          
          <div className="flex items-end justify-between">
            <div className={cn("text-2xl font-bold", colorClasses[color])}>
              {value}
            </div>
            {trend && <div className="h-10">{trend}</div>}
          </div>
          
          {footer && (
            <div className="mt-2 text-xs text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
