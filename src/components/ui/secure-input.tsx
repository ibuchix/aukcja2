import * as React from "react"
import { Input } from "./input"
import { filterInput, CHARACTER_WHITELIST, MAX_LENGTHS } from "@/utils/security/inputSanitization"
import { cn } from "@/lib/utils"

interface SecureInputProps extends React.ComponentProps<"input"> {
  fieldType: keyof typeof CHARACTER_WHITELIST;
  maxLength?: number;
  onSecureChange?: (value: string) => void;
}

/**
 * Secure input component that automatically sanitizes and filters input
 * Prevents dangerous characters and enforces length limits silently
 */
const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ className, fieldType, maxLength, onChange, onSecureChange, value, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const filteredValue = filterInput(rawValue, fieldType, maxLength);
      
      // Only update if the value actually changed after filtering
      if (filteredValue !== rawValue) {
        // Create a new event with the filtered value
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: filteredValue
          }
        };
        
        // Update the actual input value
        if (ref && 'current' in ref && ref.current) {
          ref.current.value = filteredValue;
        }
        
        onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
        onSecureChange?.(filteredValue);
      } else {
        onChange?.(e);
        onSecureChange?.(filteredValue);
      }
    };

    const appliedMaxLength = maxLength || MAX_LENGTHS[fieldType as keyof typeof MAX_LENGTHS] || 255;

    return (
      <Input
        className={cn(className)}
        onChange={handleChange}
        value={value}
        maxLength={appliedMaxLength}
        ref={ref}
        {...props}
      />
    )
  }
)

SecureInput.displayName = "SecureInput"

export { SecureInput }