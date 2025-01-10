import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DealerSignupForm } from "@/components/auth/DealerSignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Dealer {
  id: string;
  dealership_name: string;
  supervisor_name: string;
  verification_status: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState<Dealer[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        navigate('/dealer/dashboard');
      }
    });

    // Fetch dealers
    const fetchDealers = async () => {
      const { data, error } = await supabase
        .from('dealers')
        .select('*');
      
      if (error) {
        console.error('Error fetching dealers:', error);
      } else {
        setDealers(data || []);
      }
    };

    fetchDealers();
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#DC143C]" />
        <div className="relative z-20 flex items-center text-lg font-medium font-oswald">
          <img src="/placeholder.svg" alt="Logo" className="mr-2 h-6 w-6" />
          Auto-Strada
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-kanit">
              Join our network of trusted dealers and expand your reach in the automotive market.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald text-[#DC143C]">Dealer Registration</CardTitle>
              <CardDescription className="font-kanit">
                Register your dealership to start bidding on vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DealerSignupForm />
            </CardContent>
          </Card>

          {/* Display registered dealers */}
          <Card>
            <CardHeader>
              <CardTitle className="font-oswald">Registered Dealers</CardTitle>
              <CardDescription className="font-kanit">
                Currently registered dealers in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dealership Name</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dealers.map((dealer) => (
                    <TableRow key={dealer.id}>
                      <TableCell>{dealer.dealership_name}</TableCell>
                      <TableCell>{dealer.supervisor_name}</TableCell>
                      <TableCell>{dealer.verification_status}</TableCell>
                    </TableRow>
                  ))}
                  {dealers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">No dealers registered yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;