
import { Card, CardContent } from "@/components/ui/card";
import { translateUILabel, translateMessage } from "@/lib/vehicleTranslations";

export function RegistrationCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">{translateUILabel('Complete Your Registration')}</h1>
            <p className="text-muted-foreground mt-1">
              {translateMessage('Please provide the required information to finish setting up your dealer account')}
            </p>
          </div>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
