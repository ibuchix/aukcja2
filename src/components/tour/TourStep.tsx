
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { TourStep as TourStepType } from '@/contexts/tour/TourContext';

interface TourStepProps {
  step: TourStepType;
  isFirst: boolean;
  isLast: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export const TourStep: React.FC<TourStepProps> = ({
  step,
  isFirst,
  isLast,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}) => {
  const stepRef = useRef<HTMLDivElement>(null);

  // Position the tour step near the target element if one is specified
  useEffect(() => {
    if (step.targetElement && stepRef.current) {
      const targetElement = document.querySelector(step.targetElement);
      if (targetElement) {
        const targetRect = targetElement.getBoundingClientRect();
        const stepRect = stepRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top, left;
        const margin = 10; // Margin from target element

        // Default placement is bottom
        const placement = step.placement || 'bottom';

        switch (placement) {
          case 'top':
            top = targetRect.top - stepRect.height - margin;
            left = targetRect.left + (targetRect.width - stepRect.width) / 2;
            break;
          case 'right':
            top = targetRect.top + (targetRect.height - stepRect.height) / 2;
            left = targetRect.right + margin;
            break;
          case 'bottom':
            top = targetRect.bottom + margin;
            left = targetRect.left + (targetRect.width - stepRect.width) / 2;
            break;
          case 'left':
            top = targetRect.top + (targetRect.height - stepRect.height) / 2;
            left = targetRect.left - stepRect.width - margin;
            break;
        }

        // Ensure the tooltip stays within viewport
        if (top < 0) top = margin;
        if (top + stepRect.height > viewportHeight) top = viewportHeight - stepRect.height - margin;
        if (left < 0) left = margin;
        if (left + stepRect.width > viewportWidth) left = viewportWidth - stepRect.width - margin;

        stepRef.current.style.top = `${top}px`;
        stepRef.current.style.left = `${left}px`;

        // Add a class to highlight the target element
        targetElement.classList.add('tour-highlight');

        // Scroll to make the target element visible if needed
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        return () => {
          targetElement.classList.remove('tour-highlight');
        };
      }
    }
  }, [step]);

  return (
    <div
      ref={stepRef}
      className="fixed z-50 w-80 shadow-lg animate-fade-in"
      style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
      <Card className="border-2 border-primary">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-oswald">{step.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onSkip} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">{step.content}</CardContent>
        <CardFooter className="flex justify-between border-t pt-3">
          <div>
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={onPrev}>
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {isLast ? (
              <Button variant="default" size="sm" onClick={onComplete}>
                Complete
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={onNext}>
                Next
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
