
import React from 'react';
import { TourStep } from './TourStep';
import { TourOverlay } from './TourOverlay';
import { useTour } from '@/contexts/tour/TourContext';

export const Tour: React.FC = () => {
  const {
    isActive,
    steps,
    currentStepIndex,
    nextStep,
    prevStep,
    skipTour,
    endTour,
  } = useTour();

  if (!isActive || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <>
      <TourOverlay visible={isActive} />
      <TourStep
        step={currentStep}
        isFirst={isFirstStep}
        isLast={isLastStep}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
        onComplete={endTour}
      />
    </>
  );
};
