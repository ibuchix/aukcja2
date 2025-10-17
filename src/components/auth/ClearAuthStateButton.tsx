
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearAuthStorage } from "@/utils/auth-utils";
import { Trash2 } from "lucide-react";

export function ClearAuthStateButton() {
  const { toast } = useToast();
  
  const handleClearAuthStorage = () => {
    clearAuthStorage();
    
    toast({
      title: "Auth Storage Cleared",
      description: "Wszystkie dane uwierzytelniania zostały usunięte z przeglądarki.",
    });
  };
  
  return (
    <Button 
      variant="destructive" 
      onClick={handleClearAuthStorage}
      size="sm"
      className="flex items-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Clear Auth Storage
    </Button>
  );
}
