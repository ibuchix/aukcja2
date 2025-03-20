
import React from 'react';
import { TourStep } from '@/contexts/tour/TourContext';
import { DollarSign, Gift, Bell, TrendingUp, Shield, ThumbsUp } from 'lucide-react';

export const proxyBiddingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Auto-Strada!',
    content: (
      <div className="space-y-2">
        <p>
          Welcome to your new dealer dashboard! We'll guide you through the key features 
          to help you get started with proxy bidding.
        </p>
        <p className="text-sm text-muted-foreground">
          This tour will show you how to use our proxy bidding system to win auctions efficiently.
        </p>
      </div>
    ),
  },
  {
    id: 'proxy-bidding-intro',
    title: 'What is Proxy Bidding?',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">Automated Bidding System</span>
        </div>
        <p>
          Proxy bidding lets you set your maximum bid amount once, and our system
          automatically bids for you up to that amount.
        </p>
        <p className="text-sm text-muted-foreground">
          This means you don't have to manually place every bid!
        </p>
      </div>
    ),
    targetElement: '#proxy-bidding-section',
    placement: 'top',
  },
  {
    id: 'setting-max-bid',
    title: 'Setting Your Maximum Bid',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <span className="font-medium">Your Budget Limit</span>
        </div>
        <p>
          Enter the maximum amount you're willing to pay for a vehicle. This stays private - 
          other bidders won't know your maximum.
        </p>
        <p className="text-sm text-muted-foreground">
          The system will only bid as much as needed to keep you winning!
        </p>
      </div>
    ),
    targetElement: '#max-bid-input',
    placement: 'bottom',
  },
  {
    id: 'bid-increments',
    title: 'Bid Increments',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-medium">Step-by-Step Bidding</span>
        </div>
        <p>
          Our system bids in increments - the minimum amount needed to outbid others.
          For example, if the current bid is $10,000 with $500 increments, your next bid will be $10,500.
        </p>
        <p className="text-sm text-muted-foreground">
          Even if your maximum is $15,000, we'll only bid $10,500 if that's enough to win!
        </p>
      </div>
    ),
    targetElement: '#increment-info',
    placement: 'right',
  },
  {
    id: 'auto-bidding',
    title: 'Automatic Outbidding',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-primary" />
          <span className="font-medium">Let the System Work for You</span>
        </div>
        <p>
          If someone outbids you, our system automatically places a new bid on your behalf,
          up to your maximum amount.
        </p>
        <p className="text-sm text-muted-foreground">
          You can relax knowing the system is working for you 24/7!
        </p>
      </div>
    ),
  },
  {
    id: 'outbid-notifications',
    title: 'Outbid Notifications',
    content: (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-5 w-5 text-primary" />
          <span className="font-medium">Stay Informed</span>
        </div>
        <p>
          When your maximum bid is exceeded by another bidder, we'll notify you
          so you can decide whether to increase your maximum bid.
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
          Congratulations! You now understand how proxy bidding works. Browse available 
          auctions and set your maximum bids to start competing.
        </p>
        <p className="text-sm text-muted-foreground">
          You can always revisit this tour from your dashboard if you need a refresher.
        </p>
      </div>
    ),
  },
];
