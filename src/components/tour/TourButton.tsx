
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useTour } from '@/contexts/tour/TourContext';
import { cn } from '@/lib/utils';

interface TourButtonProps extends ButtonProps {
  showIcon?: boolean;
  className?: string;
}

export const TourButton: React.FC<TourButtonProps> = ({ 
  showIcon = true, 
  className,
  children = 'Start Tour', 
  ...props 
}) => {
  const { startTour, hasCompletedTour, resetTour } = useTour();

  const handleClick = () => {
    if (hasCompletedTour) {
      resetTour();
    }
    startTour();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      {showIcon && <HelpCircle className="mr-1 h-4 w-4" />}
      {children}
    </Button>
  );
};
