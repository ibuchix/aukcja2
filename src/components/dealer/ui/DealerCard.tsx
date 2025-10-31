
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DealerCardProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "outline" | "highlight";
}

/**
 * Reusable card component styled for dealer interfaces
 */
export function DealerCard({ 
  title, 
  description, 
  icon, 
  className, 
  children, 
  footer,
  variant = "default" 
}: DealerCardProps) {
  return (
    <Card className={cn(
      "transition-all duration-200", 
      variant === "highlight" && "border-primary/50 shadow-md", 
      className
    )}>
      {(title || description) && (
        <CardHeader>
          <div className="flex items-center space-x-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            {title && <CardTitle className="text-heading-md font-kanit font-semibold">{title}</CardTitle>}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-6">
        {children}
      </CardContent>
      {footer && (
        <CardFooter className="bg-muted/20 px-6 py-3">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
