
import React from "react";
import { CarSearchContent } from "./CarSearchContent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarSearchErrorDisplay } from "./status/CarSearchErrorDisplay";
import { useNavigate } from "react-router-dom";

interface CarSearchProps {
  dealerId?: string;
}

export const CarSearch = ({ dealerId }: CarSearchProps) => {
  const navigate = useNavigate();

  if (!dealerId) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <CarSearchErrorDisplay 
            errorMessage="Please complete your dealer profile to access the car search feature."
            onRefresh={() => navigate("/complete-registration")}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <CarSearchContent dealerId={dealerId} />
      </CardContent>
    </Card>
  );
};
