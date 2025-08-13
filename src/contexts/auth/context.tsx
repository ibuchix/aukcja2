
import { createContext, useContext } from "react";
import { AuthContextType, defaultContextValue } from "./types";

export const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Hook for easy context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
