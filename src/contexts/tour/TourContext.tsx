
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define tour step IDs
export type TourStepId = 
  | 'welcome'
  | 'bidding-intro'
  | 'placing-bid'
  | 'bid-increments'
  | 'bid-notifications'
  | 'complete';

// Tour step interface
export interface TourStep {
  id: TourStepId;
  title: string;
  content: React.ReactNode;
  targetElement?: string; // CSS selector for the element to highlight
  placement?: 'top' | 'right' | 'bottom' | 'left';
}

// Tour context state
interface TourContextState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndex: number) => void;
  skipTour: () => void;
  resetTour: () => void;
  hasCompletedTour: boolean;
}

// Create the context
const TourContext = createContext<TourContextState | undefined>(undefined);

// Hook to use the tour context
export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

// Tour provider props
interface TourProviderProps {
  children: React.ReactNode;
  steps: TourStep[];
}

export const TourProvider: React.FC<TourProviderProps> = ({ children, steps }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Load tour state from localStorage
  useEffect(() => {
    const savedTourState = localStorage.getItem('dealerTourState');
    if (savedTourState) {
      const { completed, lastStep } = JSON.parse(savedTourState);
      setHasCompletedTour(completed);
      setCurrentStepIndex(lastStep || 0);
    }
  }, []);

  // Save tour state to localStorage
  useEffect(() => {
    localStorage.setItem('dealerTourState', JSON.stringify({
      completed: hasCompletedTour,
      lastStep: currentStepIndex,
    }));
  }, [hasCompletedTour, currentStepIndex]);

  // Start the tour
  const startTour = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  // End the tour
  const endTour = () => {
    setIsActive(false);
    setHasCompletedTour(true);
  };

  // Navigate to the next step
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      endTour();
    }
  };

  // Navigate to the previous step
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Go to a specific step
  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
    }
  };

  // Skip the tour
  const skipTour = () => {
    setIsActive(false);
    setHasCompletedTour(true);
  };

  // Reset the tour
  const resetTour = () => {
    setCurrentStepIndex(0);
    setHasCompletedTour(false);
    setIsActive(false);
  };

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        steps,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        resetTour,
        hasCompletedTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
