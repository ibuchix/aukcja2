
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

export const VerificationSuccessCard: React.FC = () => {
  return (
    <Card className="mb-8 border-2 border-green-200 bg-green-50">
      <CardHeader className="bg-green-100">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <BadgeCheck className="w-6 h-6" />
          Account Verified
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-green-700">
          Your dealer account has been successfully verified. You can view your uploaded documents below.
        </p>
      </CardContent>
    </Card>
  );
};
