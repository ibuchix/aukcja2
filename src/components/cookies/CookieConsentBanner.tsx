import { useState } from 'react';
import { Cookie, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { CookieConsent } from '@/contexts/CookieConsentContext';

export function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectNonEssential, updateConsent } = useCookieConsent();
  const [showCustomize, setShowCustomize] = useState(false);
  const [customConsent, setCustomConsent] = useState<CookieConsent>({
    essential: true,
    functional: false,
    analytics: false,
  });

  if (!showBanner) return null;

  const handleCustomizeClick = () => {
    setShowCustomize(true);
  };

  const handleSaveCustom = () => {
    updateConsent(customConsent);
    setShowCustomize(false);
  };

  const handleToggle = (category: keyof CookieConsent, value: boolean) => {
    if (category === 'essential') return; // Can't disable essential cookies
    setCustomConsent(prev => ({ ...prev, [category]: value }));
  };

  if (showCustomize) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#383B39', borderColor: '#6A6A77' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-body-text font-oswald text-heading-md flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ustawienia plików cookie
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomize(false)}
              className="text-body-text hover:bg-accent/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-subtitle-text text-subtitle">
              Dostosuj swoje preferencje dotyczące plików cookie. Możesz zmienić te ustawienia w dowolnym momencie.
            </p>

            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-4 border border-accent/30 rounded-default">
                <div className="flex-1">
                  <Label className="text-body-text font-medium">Niezbędne pliki cookie</Label>
                  <p className="text-subtitle-text text-subtitle mt-1">
                    Wymagane do podstawowego funkcjonowania strony. Nie można ich wyłączyć.
                  </p>
                </div>
                <Switch checked={true} disabled className="ml-4" />
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between p-4 border border-accent/30 rounded-default">
                <div className="flex-1">
                  <Label className="text-body-text font-medium">Funkcjonalne pliki cookie</Label>
                  <p className="text-subtitle-text text-subtitle mt-1">
                    Umożliwiają zapamiętywanie preferencji i personalizację doświadczenia.
                  </p>
                </div>
                <Switch 
                  checked={customConsent.functional}
                  onCheckedChange={(checked) => handleToggle('functional', checked)}
                  className="ml-4"
                />
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-4 border border-accent/30 rounded-default">
                <div className="flex-1">
                  <Label className="text-body-text font-medium">Analityczne pliki cookie</Label>
                  <p className="text-subtitle-text text-subtitle mt-1">
                    Pomagają nam zrozumieć, jak korzystasz z naszej strony (obecnie nieaktywne).
                  </p>
                </div>
                <Switch 
                  checked={customConsent.analytics}
                  onCheckedChange={(checked) => handleToggle('analytics', checked)}
                  className="ml-4"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleSaveCustom}
                className="btn-primary flex-1"
              >
                Zapisz preferencje
              </Button>
              <Button 
                onClick={acceptAll}
                variant="outline"
                className="btn-secondary flex-1"
              >
                Zaakceptuj wszystkie
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/80">
      <Card className="mx-auto max-w-4xl" style={{ backgroundColor: '#383B39', borderColor: '#6A6A77' }}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-body-text font-oswald font-bold text-heading-sm mb-2">
                  Używamy plików cookie
                </h3>
                <p className="text-subtitle-text text-subtitle">
                  Ta strona używa plików cookie, aby zapewnić najlepsze doświadczenie. 
                  Niezbędne pliki cookie są wymagane do funkcjonowania strony, ale możesz 
                  dostosować pozostałe kategorie zgodnie z własnymi preferencjami.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                onClick={acceptAll}
                className="btn-primary"
              >
                Zaakceptuj wszystkie
              </Button>
              <Button
                onClick={rejectNonEssential}
                variant="outline"
                className="btn-secondary"
              >
                Tylko niezbędne
              </Button>
              <Button
                onClick={handleCustomizeClick}
                variant="ghost"
                className="text-body-text hover:bg-accent/20"
              >
                <Settings className="h-4 w-4 mr-2" />
                Dostosuj
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}