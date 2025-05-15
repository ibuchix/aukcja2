
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { clearAuthStorage } from '@/utils/auth-utils';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';

export function AuthTroubleshooter() {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleClearAuthStorage = () => {
    clearAuthStorage();
    toast({
      title: "Authentication data cleared",
      description: "All local authentication data has been reset. Please try logging in again.",
    });
  };

  return (
    <div className="mt-4 border-t pt-4 text-xs text-muted-foreground">
      <div 
        className="flex items-center justify-between cursor-pointer pb-2" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Shield className="h-3 w-3 mr-1" />
          <span>Having trouble logging in?</span>
        </div>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </div>
      
      {expanded && (
        <div className="space-y-2 pt-2 text-xs">
          <p>If you're having trouble logging in, try these steps:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Check that you're using the correct email address</li>
            <li>Ensure your password is correct (case sensitive)</li>
            <li>Try clearing your browser cache</li>
            <li>Clear local authentication data</li>
          </ol>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClearAuthStorage}
            className="mt-2 text-xs h-8"
          >
            Clear authentication data
          </Button>
        </div>
      )}
    </div>
  );
}
