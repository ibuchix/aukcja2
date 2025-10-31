import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Settings } from 'lucide-react';

export function CookiePolicy() {
  const { resetConsent } = useCookieConsent();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-heading-lg font-kanit font-bold text-body-text mb-4">
          Polityka plików cookie
        </h1>
        <p className="text-subtitle-text text-subtitle">
          Dowiedz się, jak używamy plików cookie i jak możesz zarządzać swoimi preferencjami
        </p>
      </div>

      <Card style={{ backgroundColor: '#383B39', borderColor: '#6A6A77' }}>
        <CardHeader>
          <CardTitle className="text-body-text font-kanit font-semibold">Czym są pliki cookie?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-subtitle-text">
          <p>
            Pliki cookie to małe pliki tekstowe, które są przechowywane na Twoim urządzeniu 
            podczas przeglądania stron internetowych. Pomagają nam w dostarczaniu lepszych 
            usług i personalizacji Twojego doświadczenia.
          </p>
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: '#383B39', borderColor: '#6A6A77' }}>
        <CardHeader>
          <CardTitle className="text-body-text font-kanit font-semibold">Kategorie plików cookie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Essential Cookies */}
          <div className="border-l-4 border-primary pl-4">
            <h3 className="text-body-text font-kanit font-bold text-heading-sm mb-2">
              Niezbędne pliki cookie
            </h3>
            <p className="text-subtitle-text text-subtitle mb-3">
              Te pliki cookie są niezbędne do funkcjonowania strony i nie można ich wyłączyć.
            </p>
            <div className="space-y-2 text-subtitle-text text-subtitle">
              <div><strong>Uwierzytelnianie:</strong> Tokeny sesji do logowania dealerów</div>
              <div><strong>Bezpieczeństwo:</strong> Ochrona przed atakami CSRF</div>
              <div><strong>Funkcjonalność:</strong> Podstawowe ustawienia interfejsu</div>
            </div>
          </div>

          {/* Functional Cookies */}
          <div className="border-l-4 border-iris pl-4">
            <h3 className="text-body-text font-kanit font-bold text-heading-sm mb-2">
              Funkcjonalne pliki cookie
            </h3>
            <p className="text-subtitle-text text-subtitle mb-3">
              Umożliwiają zapamiętywanie Twoich preferencji i personalizację doświadczenia.
            </p>
            <div className="space-y-2 text-subtitle-text text-subtitle">
              <div><strong>Preferencje użytkownika:</strong> Zapisane filtry wyszukiwania</div>
              <div><strong>Ustawienia interfejsu:</strong> Stan paneli bocznych i układu</div>
              <div><strong>Cache danych:</strong> Optymalizacja wydajności aplikacji</div>
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="border-l-4 border-success pl-4">
            <h3 className="text-body-text font-kanit font-bold text-heading-sm mb-2">
              Analityczne pliki cookie
            </h3>
            <p className="text-subtitle-text text-subtitle mb-3">
              Pomagają nam zrozumieć, jak korzystasz z naszej strony (obecnie nieaktywne).
            </p>
            <div className="space-y-2 text-subtitle-text text-subtitle">
              <div><strong>Statystyki odwiedzin:</strong> Analiza ruchu na stronie</div>
              <div><strong>Wzorce użytkowania:</strong> Jak dealerzy korzystają z platformy</div>
              <div><strong>Optymalizacja:</strong> Poprawa funkcjonalności na podstawie danych</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: '#383B39', borderColor: '#6A6A77' }}>
        <CardHeader>
          <CardTitle className="text-body-text font-kanit font-semibold">Zarządzanie preferencjami</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-subtitle-text text-subtitle">
            Możesz w dowolnym momencie zmienić swoje preferencje dotyczące plików cookie. 
            Kliknij poniższy przycisk, aby otworzyć panel ustawień.
          </p>
          <Button 
            onClick={resetConsent}
            className="btn-primary"
          >
            <Settings className="h-4 w-4 mr-2" />
            Zarządzaj preferencjami cookie
          </Button>
        </CardContent>
      </Card>

      <Card style={{ backgroundColor: '#383B39', borderColor: '#6A6A77' }}>
        <CardHeader>
          <CardTitle className="text-body-text font-kanit font-semibold">Kontakt</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-subtitle-text text-subtitle">
            Jeśli masz pytania dotyczące naszej polityki plików cookie, skontaktuj się z nami 
            poprzez formularz kontaktowy na stronie głównej lub wyślij e-mail na adres: 
            <span className="text-iris ml-1">privacy@autaro.pl</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}