
import React from 'react';

interface TourOverlayProps {
  visible: boolean;
}

export const TourOverlay: React.FC<TourOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 pointer-events-none"
      style={{
        // Allow clicks through to highlighted elements
        backdropFilter: 'blur(2px)',
      }}
    />
  );
};
