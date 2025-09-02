
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Mail } from "lucide-react";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";

export default function Profile() {
  const navigate = useNavigate();
  const { dealerProfile, isLoading } = useDealerProfileSimple();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Ładowanie profilu...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Profil Dealera</h1>
        
        {/* Contact Notice */}
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Zmiany Profilu:</strong> Aby zaktualizować informacje w profilu, skontaktuj się z naszym zespołem wsparcia pod adresem{" "}
            <a href="mailto:dealerzy@autaro.pl" className="inline-flex items-center text-primary hover:underline">
              <Mail className="h-3 w-3 mr-1" />
              dealerzy@autaro.pl
            </a>
            {" "}lub zadzwoń pod numer +1 (555) 123-4567. Wszystkie zmiany wymagają weryfikacji i zatwierdzenia.
          </AlertDescription>
        </Alert>

        {/* Profile Information - Read Only */}
        <Card>
          <CardHeader>
            <CardTitle>Informacje o Profilu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imię i Nazwisko Kierownika
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                    {dealerProfile?.supervisor_name || 'Nie podano'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa Dealera
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                    {dealerProfile?.dealership_name || 'Nie podano'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adres Firmy
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                  {dealerProfile?.address || 'Nie podano'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIP
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                  {dealerProfile?.tax_id || 'Nie podano'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer Rejestru Handlowego
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                  {dealerProfile?.business_registry_number || 'Nie podano'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer Licencji
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                  {dealerProfile?.license_number || 'Nie podano'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Rejestracji
                </label>
                <div className="p-3 bg-gray-50 rounded-md text-gray-900">
                  {dealerProfile?.created_at ? new Date(dealerProfile.created_at).toLocaleDateString() : 'Niedostępne'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status Weryfikacji
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {dealerProfile?.verification_status || 'Oczekujący'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
