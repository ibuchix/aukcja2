
import React from 'react';
import { TourStep } from '@/contexts/tour/TourContext';
import { Gavel, DollarSign, Bell, CheckCircle } from 'lucide-react';

export const simpleBiddingTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Witamy w prostym systemie licytacji',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          <span className="font-semibold">Prosty i bezpośredni system licytacji</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Nasz uproszczony system licytacji pozwala składać oferty bezpośrednio na aktywne aukcje. 
          Możesz licytować dowolną kwotę powyżej aktualnej najwyższej oferty - nie ma stałych kroków.
        </p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>Nowość:</strong> Możesz teraz licytować dowolną kwotę, co daje Ci pełną kontrolę nad strategią licytacji.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom'
  },
  {
    id: 'bidding-intro',
    title: 'Jak działa licytacja',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          <span className="font-semibold">Elastyczne kwoty ofert</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>• Twoja oferta musi być wyższa niż aktualna najwyższa oferta</p>
          <p>• Możesz licytować dowolną kwotę - nie są wymagane minimalne kroki</p>
          <p>• Zobacz, ilu dealerów licytuje każdy pojazd</p>
          <p>• Wszystkie Twoje oferty pojawiają się natychmiast w sekcji "Moje oferty"</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>Przykład:</strong> Jeśli obecna oferta wynosi 50 000 PLN, możesz licytować 50 001 PLN, 52 500 PLN lub dowolną kwotę powyżej 50 000 PLN.
          </p>
        </div>
      </div>
    ),
    placement: 'top'
  },
  {
    id: 'placing-bid',
    title: 'Składanie oferty',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          <span className="font-semibold">Szybka i łatwa licytacja</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>1. <strong>Wprowadź kwotę oferty</strong> - dowolną kwotę powyżej obecnej oferty</p>
          <p>2. <strong>Kliknij "Złóż ofertę"</strong>, aby natychmiast przesłać</p>
          <p>3. <strong>Otrzymaj natychmiastowe potwierdzenie</strong> po złożeniu oferty</p>
          <p>4. <strong>Śledź wszystkie swoje oferty</strong> w sekcji "Moje oferty"</p>
        </div>
        <div className="bg-amber-50 p-3 rounded-lg">
          <p className="text-xs text-amber-700">
            <strong>Wskazówka:</strong> Możesz zobaczyć, ilu innych dealerów jest zainteresowanych każdym pojazdem przed złożeniem oferty.
          </p>
        </div>
      </div>
    ),
    targetElement: '[data-tour="bid-form"]',
    placement: 'top'
  },
  {
    id: 'bid-notifications',
    title: 'Bądź na bieżąco',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">Aktualizacje w czasie rzeczywistym</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>• Otrzymuj natychmiastowe powiadomienia, gdy zostaniesz przebity</p>
          <p>• Zobacz aktualizacje liczby ofert dla każdego pojazdu na żywo</p>
          <p>• Monitoruj wszystkie swoje aktywne oferty w jednym miejscu</p>
          <p>• Przeglądaj historię i status swoich licytacji</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700">
            Sekcja "Moje oferty" aktualizuje się automatycznie za każdym razem, gdy złożysz nową ofertę lub zmieni się Twój status.
          </p>
        </div>
      </div>
    ),
    placement: 'bottom'
  },
  {
    id: 'complete',
    title: 'Gotowy do licytacji!',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold">Wszystko gotowe!</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Teraz już wiesz, jak korzystać z naszego prostego systemu licytacji. Pamiętaj, że masz pełną elastyczność 
          w kwotach ofert i możesz śledzić wszystko w swoim osobistym panelu.
        </p>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-700">
            <strong>Zacznij licytować:</strong> Przeglądaj aktywne aukcje i złóż swoją pierwszą ofertę z dowolną kwotą powyżej obecnej najwyższej oferty!
          </p>
        </div>
      </div>
    ),
    placement: 'bottom'
  }
];
