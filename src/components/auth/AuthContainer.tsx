
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SessionExpiredNotice } from "@/components/auth/SessionExpiredNotice";

interface AuthContainerProps {
  children: React.ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r" style={{backgroundColor: '#393b39'}}>
        <div className="relative z-20 flex items-center justify-center text-lg font-medium w-full">
          <Link to="/">
            <img 
              src="/lovable-uploads/d8a5a005-f005-4fdd-bff5-ea162d51e15d.png" 
              alt="Autaro Logo" 
              className="h-16"
            />
          </Link>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center" style={{backgroundColor: '#454545'}}>
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card className="border-white/20" style={{backgroundColor: '#454545'}}>
            <CardHeader>
              <CardTitle className="font-oswald text-[#D81B24]">Dealer Portal</CardTitle>
              <CardDescription className="font-kanit text-[#FCFCFC]">
                Register or login to your dealer account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionExpiredNotice />
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
