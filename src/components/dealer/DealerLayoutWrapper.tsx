import React from 'react';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { useDealerProfileSimple } from '@/hooks/useDealerProfileSimple';

interface DealerLayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides dealer-specific contexts
 * Includes WishlistProvider with the current dealer's ID
 */
export const DealerLayoutWrapper: React.FC<DealerLayoutWrapperProps> = ({ children }) => {
  const { dealerProfile } = useDealerProfileSimple();

  return (
    <WishlistProvider dealerId={dealerProfile?.id}>
      {children}
    </WishlistProvider>
  );
};
