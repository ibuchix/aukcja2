
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SessionExpiredNotice } from "@/components/auth/SessionExpiredNotice";

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{backgroundColor: '#454545'}}>
      {/* Centered Logo */}
      <div className="mb-8">
        <Link to="/">
          <img 
            src="/autaro-logo.png" 
            alt="Autaro Logo" 
            className="h-20 w-auto"
          />
        </Link>
      </div>
      
      {/* Centered Form Card */}
      <div className="w-full max-w-md">
        <Card className="border-white/20" style={{backgroundColor: '#454545'}}>
          <CardHeader>
            <CardTitle className="font-oswald text-[#D81B24] text-center">Portal dealera</CardTitle>
            <CardDescription className="font-kanit text-[#FCFCFC] text-center">
              Zarejestruj się lub zaloguj do konta dealera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SessionExpiredNotice />
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
