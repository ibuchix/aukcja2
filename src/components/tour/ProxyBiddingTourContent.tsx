
import React from 'react';
import { TourStep } from '@/contexts/tour/TourContext';
import { DollarSign, Bell, TrendingUp, Shield, ThumbsUp } from 'lucide-react';

export const simpleBiddingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Auto-Strada!',
    content: (
      <div className="space-y-2">
        <p>
          Welcome to your new dealer dashboard! We'll guide you through the key features 
          to help you get started with bidding on vehicles.
        </p>
        <p className="text-sm text-muted-foreground">
          This tour will show you how to use our bidding system to win auctions efficiently.
        </p>
      </div>
    ),
  },
  {
    id: 'bidding-intro',
    title: 'How Bidding Works',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">Simple Bidding System</span>
        </div>
        <p>
          Our straightforward bidding system allows you to place bids on vehicles
          during live auctions. Simply enter your bid amount and place your bid.
        </p>
        <p className="text-sm text-muted-foreground">
          You can update your bid anytime during the auction!
        </p>
      </div>
    ),
    targetElement: '#bidding-section',
    placement: 'top',
  },
  {
    id: 'placing-bid',
    title: 'Placing Your Bid',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="font-medium">Enter Your Bid Amount</span>
        </div>
        <p>
          Enter the amount you're willing to pay for a vehicle. Your bid must be higher
          than the current highest bid by at least the minimum increment.
        </p>
        <p className="text-sm text-muted-foreground">
          The minimum increment is typically 250 PLN for most auctions.
        </p>
      </div>
    ),
    targetElement: '#bid-input',
    placement: 'bottom',
  },
  {
    id: 'bid-increments',
    title: 'Bid Increments',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-medium">Minimum Bid Increments</span>
        </div>
        <p>
          Each bid must be at least 250 PLN higher than the current highest bid.
          For example, if the current bid is 10,000 PLN, your bid must be at least 10,250 PLN.
        </p>
        <p className="text-sm text-muted-foreground">
          This ensures fair competition and prevents spam bidding.
        </p>
      </div>
    ),
    targetElement: '#increment-info',
    placement: 'right',
  },
  {
    id: 'bid-notifications',
    title: 'Bid Notifications',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-5 w-5 text-primary" />
          <span className="font-medium">Stay Informed</span>
        </div>
        <p>
          When someone outbids you, we'll notify you so you can decide whether
          to place a higher bid before the auction ends.
        </p>
        <p className="text-sm text-muted-foreground">
          You'll never miss out on a vehicle you really want!
        </p>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'Ready to Start Bidding!',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <ThumbsUp className="h-5 w-5 text-primary" />
          <span className="font-medium">You're All Set!</span>
        </div>
        <p>
          Congratulations! You now understand how our bidding system works. Browse available 
          auctions and place your bids to start competing.
        </p>
        <p className="text-sm text-muted-foreground">
          You can always revisit this tour from your dashboard if you need a refresher.
        </p>
      </div>
    ),
  },
];
