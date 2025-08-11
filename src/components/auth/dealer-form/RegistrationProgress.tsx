import { Progress } from "@/components/ui/progress";

interface RegistrationProgressProps {
  step: number;
}

export function RegistrationProgress({ step }: RegistrationProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between mb-2 text-sm text-muted-foreground">
        <span>Rejestracja</span>
        <span>Przetwarzanie</span>
        <span>Potwierdzenie</span>
      </div>
      <Progress value={(step / 3) * 100} className="h-2" />
    </div>
  );
}