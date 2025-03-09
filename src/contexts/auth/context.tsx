
import { createContext, useContext } from "react";
import { AuthContextType, defaultContextValue } from "./types";

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}
