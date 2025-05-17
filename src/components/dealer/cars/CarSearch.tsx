
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search } from "lucide-react";
import { CarSearchContent } from "./CarSearchContent";

interface CarSearchProps {
  dealerId: string;
}

export const CarSearch = ({ dealerId }: CarSearchProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Search className="h-6 w-6 text-primary" />
          <CardTitle>Car Search</CardTitle>
        </div>
        <CardDescription>
          Find available vehicles and upcoming auctions directly from your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <CarSearchContent dealerId={dealerId} />
      </CardContent>
    </Card>
  );
};
