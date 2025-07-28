
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

export const VerificationSuccessCard: React.FC = () => {
  return (
    <Card className="mb-8 border-2 border-success/30 bg-secondary">
      <CardHeader className="bg-success/10 border-b border-success/20">
        <CardTitle className="flex items-center gap-2 text-success">
          <BadgeCheck className="w-6 h-6" />
          Account Verified
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="text-body-text">
          Your dealer account has been successfully verified. You can view your uploaded documents below.
        </p>
      </CardContent>
    </Card>
  );
};
