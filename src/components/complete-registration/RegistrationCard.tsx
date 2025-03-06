
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface RegistrationCardProps {
  children: ReactNode;
}

export function RegistrationCard({ children }: RegistrationCardProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-oswald text-[#DC143C]">Complete Your Registration</CardTitle>
          <CardDescription className="font-kanit">
            Please provide your dealer information to complete the registration process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
