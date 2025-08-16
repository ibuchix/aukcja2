import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

export function UtilityBillPendingStatus() {
  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-yellow-800 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Rachunek za media
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="border-yellow-300 bg-yellow-100">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Oczekuje na weryfikację</strong>
            <br />
            Twój rachunek za media został przesłany i oczekuje na weryfikację przez nasz zespół. 
            Otrzymasz powiadomienie e-mail po zakończeniu procesu weryfikacji.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}