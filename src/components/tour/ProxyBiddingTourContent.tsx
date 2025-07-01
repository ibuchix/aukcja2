
import React from 'react';
import { TourStep } from '@/contexts/tour/TourContext';
import { Gavel, DollarSign, Bell, CheckCircle } from 'lucide-react';

export const simpleBiddingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Simple Bidding',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          <span className="font-semibold">Simple & Direct Bidding System</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Our streamlined bidding system allows you to place bids directly on live auctions. 
          You can bid any amount above the current highest bid - there are no fixed increments.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>New:</strong> You can now bid any amount you want, giving you complete control over your bidding strategy.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom'
  },
  {
    id: 'bidding-intro',
    title: 'How Bidding Works',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="font-semibold">Flexible Bid Amounts</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>• Your bid must be higher than the current highest bid</p>
          <p>• You can bid any amount - no minimum increments required</p>
          <p>• See how many dealers are bidding on each vehicle</p>
          <p>• All your bids appear instantly in "My Bids" section</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>Example:</strong> If current bid is 50,000 PLN, you can bid 50,001 PLN, 52,500 PLN, or any amount above 50,000 PLN.
          </p>
        </div>
      </div>
    ),
    placement: 'top'
  },
  {
    id: 'placing-bid',
    title: 'Placing Your Bid',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          <span className="font-semibold">Quick & Easy Bidding</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>1. <strong>Enter your bid amount</strong> - any amount above current bid</p>
          <p>2. <strong>Click "Place Bid"</strong> to submit instantly</p>
          <p>3. <strong>Get immediate confirmation</strong> when your bid is placed</p>
          <p>4. <strong>Track all your bids</strong> in the "My Bids" section</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>Tip:</strong> You can see how many other dealers are interested in each vehicle before placing your bid.
          </p>
        </div>
      </div>
    ),
    targetElement: '[data-tour="bid-form"]',
    placement: 'top'
  },
  {
    id: 'bid-notifications',
    title: 'Stay Updated',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Real-time Updates</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>• Get notified immediately when you're outbid</p>
          <p>• See live updates of bid counts on each vehicle</p>
          <p>• Monitor all your active bids in one place</p>
          <p>• View your bidding history and status</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            Your "My Bids" section updates automatically whenever you place a new bid or your status changes.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom'
  },
  {
    id: 'complete',
    title: 'Ready to Start Bidding!',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold">You're All Set!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          You now know how to use our simple bidding system. Remember, you have complete flexibility 
          in your bid amounts and can track everything in your personal dashboard.
        </p>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>Start bidding:</strong> Browse live auctions and place your first bid with any amount above the current highest bid!
          </p>
        </div>
      </div>
    ),
    placement: 'bottom'
  }
];
