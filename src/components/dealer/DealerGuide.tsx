import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function DealerGuide() {
  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        <CardTitle>Dealer Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="proxy-bidding">
            <AccordionTrigger>Proxy Bidding System</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>
                  Our proxy bidding system automatically places bids on your behalf up to your specified maximum amount. This ensures you don't miss out on vehicles you're interested in.
                </p>
                <h4 className="font-bold mt-2">How it works:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Enter your maximum bid amount</li>
                  <li>System bids incrementally on your behalf</li>
                  <li>Never exceeds your maximum amount</li>
                  <li>Automatically counters other bids</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="managing-bids">
            <AccordionTrigger>Managing Your Bids</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>Track and manage all your bids from the dashboard:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>View active proxy bids</li>
                  <li>Monitor current bid status</li>
                  <li>Adjust maximum bid amounts</li>
                  <li>Check for any proxy bid errors</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="best-practices">
            <AccordionTrigger>Bidding Best Practices</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <h4 className="font-bold">Setting Maximum Bids:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Consider the vehicle's market value</li>
                  <li>Account for minimum bid increments</li>
                  <li>Set realistic maximum amounts</li>
                </ul>
                <h4 className="font-bold mt-2">Safety Features:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Rate limiting prevents excessive bidding</li>
                  <li>Automatic validation checks</li>
                  <li>Error recovery system</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="notifications">
            <AccordionTrigger>Understanding Notifications</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <p>Stay informed with real-time notifications:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Winning bid notifications</li>
                  <li>Proxy bid status updates</li>
                  <li>Error notifications</li>
                  <li>Important auction updates</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}