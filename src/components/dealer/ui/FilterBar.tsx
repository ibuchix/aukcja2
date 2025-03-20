
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
  searchComponent?: ReactNode;
}

/**
 * Reusable filter bar for dealer data views
 */
export function FilterBar({ 
  children, 
  onClear, 
  showClear = false,
  className,
  searchComponent
}: FilterBarProps) {
  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 bg-muted/30 rounded-lg",
      className
    )}>
      {searchComponent && (
        <div className="w-full sm:w-auto sm:flex-1 mb-2 sm:mb-0">
          {searchComponent}
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {children}
        
        {showClear && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Search component for the filter bar
 */
export function FilterSearch({ 
  value, 
  onChange, 
  placeholder = "Search...",
  className
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}
