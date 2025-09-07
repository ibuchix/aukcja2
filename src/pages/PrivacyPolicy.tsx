import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wróć
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            POLITYKA PRYWATNOŚCI SERWISU INTERNETOWEGO
          </h1>
          <p className="text-xl text-muted-foreground">WWW.AUTARO.PL</p>
        </div>

        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 1 POSTANOWIENIA OGÓLNE</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>1.</strong> Administratorem danych osobowych zbieranych za pośrednictwem Serwisu internetowego www.autaro.pl jest TIKOO SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ wpisana do Rejestru Przedsiębiorców przez SĄD REJONOWY GDAŃSK-PÓŁNOC W GDAŃSKU, VIII WYDZIAŁ GOSPODARCZY KRAJOWEGO REJESTRU SĄDOWEGO pod numerem KRS: 0000351062, kapitał zakładowy: 50 000,00 zł, miejsce wykonywania działalności oraz adres do doręczeń: os. Przyjaźni 2/22, 84-200 Wejherowo, NIP: 5882346564, REGON: 220989555, adres poczty elektroniczej (e-mail): pomoc@autaro.pl, zwana dalej „Administratorem" i będąca jednocześnie „Usługodawcą".
                </p>
                <p>
                  <strong>2.</strong> Dane osobowe zbierane przez Administratora za pośrednictwem strony internetowej są przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych), zwane dalej RODO.
                </p>
                <p>
                  <strong>3.</strong> Wszelkie wyrazy lub wyrażenia pisane w treści niniejszej Polityki Prywatności dużą literą należy rozumieć zgodnie z ich definicją zawartą w Regulaminie Sprzedawców Serwisu internetowego www.autaro.pl.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 2 RODZAJ PRZETWARZANYCH DANYCH OSOBOWYCH, CEL I ZAKRES ZBIERANIA DANYCH</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>1. CEL PRZETWARZANIA I PODSTAWA PRAWNA.</strong> Administrator przetwarza dane osobowe Usługobiorców Serwisu www.autaro.pl w przypadku:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>1.1.</strong> rejestracji Konta Sprzedawcy w Serwisie w celu utworzenia indywidualnego konta i zarządzania tym Kontem na podstawie art. 6 ust. 1 lit. b) RODO (realizacja umowy o świadczenie usługi drogą elektroniczną zgodnie z Regulaminem Serwisu),</li>
                  <li><strong>1.2.</strong> sprzedaży Produktów za pośrednictwem Serwisu na podstawie art. 6 ust. 1 lit. b) RODO (realizacja umowy o świadczenie usługi drogą elektroniczną zgodnie z Regulaminem Serwisu),</li>
                  <li><strong>1.3.</strong> skorzystania z Formularza Wyceny w celu przedstawienia potencjalnej wyceny Produktu, na podstawie art. 6 ust. 1 lit. b) RODO (realizacja umowy o świadczenie usługi drogą elektroniczną zgodnie z Regulaminem Serwisu).</li>
                </ul>
                <p>
                  <strong>2. RODZAJ PRZETWARZANYCH DANYCH OSOBOWYCH.</strong> Usługobiorca podaje, w przypadku:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>2.1.</strong> Konta Sprzedawcy: adres mailowy, imię i nazwisko, numer telefonu, adres,</li>
                  <li><strong>2.2.</strong> Sprzedaży Produktów: adres mailowy, imię i nazwisko, numer telefonu, adres, seria i numer dowodu osobistego,</li>
                  <li><strong>2.3.</strong> Formularza Wyceny: adres mailowy, imię i nazwisko, numer telefonu, adres, seria i numer dowodu osobistego.</li>
                </ul>
                <p>
                  <strong>3. OKRES ARCHIWIZACJI DANYCH OSOBOWYCH.</strong> Dane osobowe Usługobiorców przechowywane są przez Administratora:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>3.1.</strong> w przypadku, gdy podstawą przetwarzania danych jest wykonanie umowy, tak długo, jak jest to niezbędne do wykonania umowy, a po tym czasie przez okres odpowiadający okresowi przedawnienia roszczeń. Jeżeli przepis szczególny nie stanowi inaczej, termin przedawnienia wynosi lat sześć, a dla roszczeń o świadczenia okresowe oraz roszczeń związanych z prowadzeniem działalności gospodarczej - trzy lata,</li>
                  <li><strong>3.2.</strong> w przypadku, gdy podstawą przetwarzania danych jest zgoda, tak długo, aż zgoda nie zostanie odwołana, a po odwołaniu zgody przez okres czasu odpowiadający okresowi przedawnienia roszczeń jakie może podnosić Administrator i jakie mogą być podnoszone wobec niego. Jeżeli przepis szczególny nie stanowi inaczej, termin przedawnienia wynosi lat sześć, a dla roszczeń o świadczenia okresowe oraz roszczeń związanych z prowadzeniem działalności gospodarczej - trzy lata.</li>
                </ul>
                <p>
                  <strong>4.</strong> Podczas korzystania z Serwisu mogą być pobierane dodatkowe informacje, w szczególności: adres IP przypisany do komputera Usługobiorcy lub zewnętrzny adres IP dostawcy Internetu, nazwa domeny, rodzaj przeglądarki, czas dostępu, typ systemu operacyjnego.
                </p>
                <p>
                  <strong>5.</strong> Po wyrażeniu odrębnej zgody, na podstawie art. 6 ust. 1 lit. a) RODO dane mogą być przetwarzane również w celu przesyłania informacji handlowych drogą elektroniczną lub wykonywania telefonicznych połączeń w celu marketingu bezpośredniego – odpowiednio w związku z art. 10 ust. 2 Ustawy z dnia 18 lipca 2002 roku o świadczeniu usług drogą elektroniczną lub art. 172 ust. 1 Ustawy z dnia 16 lipca 2004 roku – Prawo Telekomunikacyjne, w tym kierowanych w wyniku profilowania, o ile Usługobiorca wyraził stosowną zgodę.
                </p>
                <p>
                  <strong>6.</strong> Od Usługobiorców mogą być także gromadzone dane nawigacyjne, w tym informacje o linkach i odnośnikach, w które zdecydują się kliknąć lub innych czynnościach, podejmowanych w Serwisie. Podstawą prawną tego rodzaju czynności jest prawnie uzasadniony interes Administratora (art. 6 ust. 1 lit. f RODO), polegający na ułatwieniu korzystania z usług świadczonych drogą elektroniczną oraz na poprawie funkcjonalności tych usług.
                </p>
                <p>
                  <strong>7.</strong> Podanie danych osobowych przez Usługobiorcę jest dobrowolne.
                </p>
                <p>
                  <strong>8.</strong> Administrator dokłada szczególnej staranności w celu ochrony interesów osób, których dane dotyczą, a w szczególności zapewnia, że zbierane przez niego dane są:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>8.1.</strong> przetwarzane zgodnie z prawem,</li>
                  <li><strong>8.2.</strong> zbierane dla oznaczonych, zgodnych z prawem celów i niepoddawane dalszemu przetwarzaniu niezgodnemu z tymi celami,</li>
                  <li><strong>8.3.</strong> merytorycznie poprawne i adekwatne w stosunku do celów, w jakich są przetwarzane oraz przechowywane w postaci umożliwiającej identyfikację osób, których dotyczą, nie dłużej niż jest to niezbędne do osiągnięcia celu przetwarzania.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 3 UDOSTĘPNIENIE DANYCH OSOBOWYCH</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>1.</strong> Dane osobowe Usługobiorców przekazywane są dostawcom usług, z których korzysta Administrator przy prowadzeniu Serwisu, a w szczególności do:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>1.1.</strong> hostingodawcy,</li>
                  <li><strong>1.2.</strong> dostawcy oprogramowania umożliwiającego prowadzenie działalności,</li>
                  <li><strong>1.3.</strong> podmiotów zapewniających system mailingowy,</li>
                  <li><strong>1.4.</strong> dostawców Systemu Opinii,</li>
                  <li><strong>1.5.</strong> biura księgowego,</li>
                  <li><strong>1.6.</strong> podmiotów realizujących dostawy,</li>
                  <li><strong>1.7.</strong> dostawców elektronicznych systemów płatności,</li>
                  <li><strong>1.8.</strong> dostawcy oprogramowania potrzebnego do prowadzenia serwisu internetowego.</li>
                </ul>
                <p>
                  <strong>2.</strong> Dostawcy usług, o których mowa w pkt 1 niniejszego paragrafu, którym przekazywane są dane osobowe, w zależności od uzgodnień umownych i okoliczności, albo podlegają poleceniom Administratora co do celów i sposobów przetwarzania tych danych (podmioty przetwarzające) albo samodzielnie określają cele i sposoby ich przetwarzania (administratorzy).
                </p>
                <p>
                  <strong>3.</strong> Dane osobowe Usługobiorców są przechowywane wyłącznie na terenie Europejskiego Obszaru Gospodarczego (EOG), z zastrzeżeniem § 5 pkt 5 Polityki Prywatności.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 4 PRAWO KONTROLI, DOSTĘPU DO TREŚCI WŁASNYCH DANYCH ORAZ ICH POPRAWIANIA</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>1.</strong> Osoba, której dane dotyczą, ma prawo dostępu do treści swoich danych osobowych oraz prawo ich sprostowania, usunięcia, ograniczenia przetwarzania, prawo do przenoszenia danych, prawo wniesienia sprzeciwu, prawo do cofnięcia zgody w dowolnym momencie bez wpływu na zgodność z prawem przetwarzania, którego dokonano na podstawie zgody przed jej cofnięciem.
                </p>
                <p>
                  <strong>2.</strong> Podstawy prawne żądania Usługobiorcy:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>2.1.</strong> Dostęp do danych – art. 15 RODO.</li>
                  <li><strong>2.2.</strong> Sprostowanie danych – art. 16 RODO.</li>
                  <li><strong>2.3.</strong> Usunięcie danych (tzw. prawo do bycia zapomnianym) – art. 17 RODO.</li>
                  <li><strong>2.4.</strong> Ograniczenie przetwarzania – art. 18 RODO.</li>
                  <li><strong>2.5.</strong> Przeniesienie danych – art. 20 RODO.</li>
                  <li><strong>2.6.</strong> Sprzeciw – art. 21 RODO</li>
                  <li><strong>2.7.</strong> Cofnięcie zgody – art. 7 ust. 3 RODO.</li>
                </ul>
                <p>
                  <strong>3.</strong> W celu realizacji uprawnień, o których mowa w pkt 2 można wysłać stosowną wiadomość e-mail na adres: pomoc@autaro.pl
                </p>
                <p>
                  <strong>4.</strong> W sytuacji wystąpienia przez Usługobiorcę z uprawnieniem wynikającym z powyższych praw, Administrator spełnia żądanie albo odmawia jego spełnienia niezwłocznie, nie później jednak niż w ciągu miesiąca po jego otrzymaniu. Jeżeli jednak - z uwagi na skomplikowany charakter żądania lub liczbę żądań – Administrator nie będzie mógł spełnić żądania w ciągu miesiąca, spełni je w ciągu kolejnych dwóch miesięcy informując Usługobiorcę uprzednio w terminie miesiąca od otrzymania żądania - o zamierzonym przedłużeniu terminu oraz jego przyczynach.
                </p>
                <p>
                  <strong>5.</strong> W przypadku stwierdzenia, że przetwarzanie danych osobowych narusza przepisy RODO, osoba, której dane dotyczą, ma prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 5 PLIKI "COOKIES"</h2>
              <div className="space-y-4 text-muted-foreground">
                <p><strong>1.</strong> Strona Administratora używa plików „cookies".</p>
                <p><strong>2.</strong> Instalacja plików „cookies" jest konieczna do prawidłowego świadczenia usług na stronie internetowej Serwisu. W plikach „cookies" znajdują się informacje niezbędne do prawidłowego funkcjonowania strony, a także dają one także możliwość opracowywania ogólnych statystyk odwiedzin strony internetowej.</p>
                <p><strong>3.</strong> W ramach strony stosowane są dwa rodzaje plików „cookies": „sesyjne" oraz „stałe".</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>3.1.</strong> „cookies" „sesyjne" są plikami tymczasowymi, które przechowywane są w urządzeniu końcowym Usługobiorcy do czasu wylogowania (opuszczenia strony),</li>
                  <li><strong>3.2.</strong> „stałe" pliki „cookies" przechowywane są w urządzeniu końcowym Usługobiorcy przez czas określony w parametrach plików „cookies" lub do czasu ich usunięcia przez Usługobiorcę.</li>
                </ul>
                <p><strong>4.</strong> Administrator wykorzystuje własne pliki cookies w celu lepszego poznania sposobu interakcji Usługobiorców w zakresie zawartości strony. Pliki gromadzą informacje o sposobie korzystania ze strony internetowej przez Usługobiorcę, typie strony, z jakiej Usługobiorca został przekierowany oraz liczbie odwiedzin i czasie wizyty Usługobiorcy na stronie internetowej. Informacje te nie rejestrują konkretnych danych osobowych Usługobiorcy, lecz służą do opracowania statystyk korzystania ze strony.</p>
                <p><strong>5.</strong> Administrator wykorzystuje również zewnętrzne pliki cookies w celu zbierania ogólnych i anonimowych danych statycznych za pośrednictwem narzędzi analitycznych Google Analytics (administrator cookies zewnętrznego: Google LLC. z siedzibą w USA).</p>
                <p><strong>6.</strong> Pliki cookies mogą być również wykorzystywane przez sieci reklamowe, w szczególności sieć Google, w celu wyświetlania reklam dopasowanych do sposobu, w jaki Usługobiorca korzysta z Serwisu. W tym celu mogą zachować informację o ścieżce nawigacji Usługobiorcy lub czasie pozostawania na danej stronie.</p>
                <p><strong>7.</strong> Usługobiorca ma prawo zadecydowania w zakresie dostępu plików „cookies" do swojego komputera poprzez:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>7.1.</strong> wybór rodzajów plików cookies, na gromadzenie których wyraża zgodę tuż po wejściu na stronę Serwisu i pojawieniu się komunikatu dotyczącego cookies,</li>
                  <li><strong>7.2.</strong> zmianę ustawień w oknie swojej przeglądarki. Szczegółowe informacje o możliwości i sposobach obsługi plików „cookies" dostępne są również w ustawieniach oprogramowania (przeglądarki internetowej).</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 6 USŁUGI DODATKOWE ZWIĄZANE Z AKTYWNOŚCIĄ UŻYTKOWNIKA W SERWISIE</h2>
              <div className="space-y-4 text-muted-foreground">
                <p><strong>1.</strong> W Serwisie wykorzystywane są tzw. wtyczki społecznościowe („wtyczki") serwisów społecznościowych. Wyświetlając stronę internetową www.autaro.pl, zawierającą taką wtyczkę przeglądarka Usługobiorcy nawiąże bezpośrednie połączenie z serwerami Facebook, Instagram, Youtube, Google oraz TikTok. Platformy google i youtube też.</p>
                <p><strong>2.</strong> Zawartość wtyczki jest przekazywana przez danego usługodawcę bezpośrednio do przeglądarki Usługobiorcy i integrowana ze stroną. Dzięki tej integracji usługodawcy otrzymują informację, że przeglądarka Usługobiorcy wyświetliła stronę www.autaro.pl, nawet jeśli Usługobiorca nie posiada profilu u danego usługodawcy, czy nie jest u niego akurat zalogowany. Taka informacja (wraz z adresem IP Usługobiorcy) jest przesyłana przez przeglądarkę bezpośrednio do serwera danego usługodawcy (niektóre serwery znajdują się w USA) i tam przechowywana.</p>
                <p><strong>3.</strong> Jeśli Usługobiorca zaloguje się do jednego z powyższych serwisów społecznościowych, to usługodawca ten będzie mógł bezpośrednio przyporządkować wizytę na stronie www.autaro.pl do profilu Usługobiorcy w danym serwisie społecznościowym.</p>
                <p><strong>4.</strong> Jeśli Usługobiorca użyje danej wtyczki np. klikając na przycisk „Lubię to" lub przycisk „Udostępnij", to odpowiednia informacja zostanie również przesłana bezpośrednio na serwer danego usługodawcy i tam zachowana.</p>
                <p><strong>5.</strong> Cel i zakres gromadzenia danych oraz ich dalszego przetwarzania i wykorzystania przez usługodawców, jak również możliwość kontaktu oraz prawa Usługobiorcy w tym zakresie i możliwość dokonania ustawień zapewniających ochronę prywatności Usługobiorcy zostały opisane w polityce prywatności usługodawców:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>5.1.</strong> https://www.facebook.com/policy.php</li>
                  <li><strong>5.2.</strong> https://help.instagram.com/519522125107875?helpref=page_content</li>
                  <li><strong>5.3.</strong> https://www.tiktok.com/legal/page/eea/privacy-policy/pl</li>
                  <li><strong>5.4.</strong> https://policies.google.com/privacy?hl=pl&gl=ZZ.</li>
                </ul>
                <p><strong>6.</strong> Jeśli Usługobiorca nie chce, aby serwisy społecznościowe przyporządkowywały dane zebrane w trakcie odwiedzin na stronie www.autaro.pl bezpośrednio jego profilowi w danym serwisie, to przed wizytą na stronie www.autaro.pl musi wylogować się z tego serwisu. Usługobiorca może również całkowicie uniemożliwić załadowanie na stronie wtyczek stosując odpowiednie rozszerzenia dla przeglądarki np. blokowanie skryptów za pomocą „NoScript".</p>
                <p><strong>7.</strong> Administrator wykorzystuje na swojej stronie narzędzia remarketingowe tj. Google Ads. Ich używanie wiąże się wykorzystywaniem plików cookies firmy Google LLC. dotyczących usługi Google Ads. W ramach mechanizmu do zarządzania ustawieniami plików cookies Usługobiorca ma możliwość zdecydowania czy Usługodawca będzie mógł korzystać z Google Ads (administrator cookies zewnętrznego: Google LLC. z siedzibą w USA) w stosunku do niego.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">§ 7 POSTANOWIENIA KOŃCOWE</h2>
              <div className="space-y-4 text-muted-foreground">
                <p><strong>1.</strong> Administrator stosuje środki techniczne i organizacyjne zapewniające ochronę przetwarzanych danych osobowych odpowiednią do zagrożeń oraz kategorii danych objętych ochroną, a w szczególności zabezpiecza dane przed ich udostępnieniem osobom nieupoważnionym, zabraniem przez osobę nieuprawnioną, przetwarzaniem z naruszeniem obowiązujących przepisów oraz zmianą, utratą, uszkodzeniem lub zniszczeniem.</p>
                <p><strong>2.</strong> Administrator udostępnia odpowiednie środki techniczne zapobiegające pozyskiwaniu i modyfikowaniu przez osoby nieuprawnione, danych osobowych przesyłanych drogą elektroniczną.</p>
                <p><strong>3.</strong> W sprawach nieuregulowanych niniejszą Polityką prywatności stosuje się odpowiednio przepisy RODO oraz inne właściwe przepisy prawa polskiego.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}