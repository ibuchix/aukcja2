
import React from 'react';
import { TourProvider as TourContextProvider } from '@/contexts/tour/TourContext';
import { Tour } from '@/components/tour/Tour';
import { proxyBiddingTourSteps } from '@/components/tour/ProxyBiddingTourContent';

interface TourProviderProps {
  children: React.ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  return (
    <TourContextProvider steps={proxyBiddingTourSteps}>
      {children}
      <Tour />
    </TourContextProvider>
  );
};
