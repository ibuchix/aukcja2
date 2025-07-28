
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDown, Download } from "lucide-react";
import jsPDF from 'jspdf';
import { useToast } from "@/components/ui/use-toast";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";

interface LoyaltyAgreementData {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerAddress: string;
  vinNumber: string;
  cancellationReason: string;
  refundDays: string;
  buyerSignatureDate: string;
  sellerSignatureDate: string;
}

export function LoyaltyAgreementForm() {
  const { dealerProfile } = useDealerProfileSimple();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<LoyaltyAgreementData>({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    buyerAddress: '',
    sellerName: dealerProfile?.supervisor_name || '',
    sellerEmail: '',
    sellerPhone: '',
    sellerAddress: dealerProfile?.address || '',
    vinNumber: '',
    cancellationReason: '',
    refundDays: '7',
    buyerSignatureDate: new Date().toLocaleDateString('pl-PL'),
    sellerSignatureDate: new Date().toLocaleDateString('pl-PL')
  });

  const handleInputChange = (field: keyof LoyaltyAgreementData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Set font for Polish characters
      doc.setFont("helvetica");
      
      // Header
      doc.setFontSize(16);
      doc.text('UMOWA LOJALNOŚCIOWA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('zawarta pomiędzy:', 105, 30, { align: 'center' });
      
      // Company details
      doc.setFontSize(10);
      doc.text('AUTO-STRADA (Tikoo Sp. z o.o.)', 20, 45);
      doc.text('KRS: 0000351062', 20, 52);
      doc.text('Adres: os. Przyjaźni 2/22, 84-200 Wejherowo', 20, 59);
      doc.text('NIP: 5882346564 | REGON: 220989555', 20, 66);
      doc.text('E-mail: firmy@auto-strada.pl', 20, 73);
      
      // Buyer data section
      doc.setFontSize(12);
      doc.text('DANE NABYWCY (Zobowiązanego):', 20, 88);
      doc.setFontSize(10);
      doc.text(`Imię i nazwisko: ${formData.buyerName}`, 20, 98);
      doc.text(`Adres e-mail: ${formData.buyerEmail}`, 20, 105);
      doc.text(`Telefon: ${formData.buyerPhone}`, 20, 112);
      doc.text(`Adres: ${formData.buyerAddress}`, 20, 119);
      
      // Seller data section
      doc.setFontSize(12);
      doc.text('DANE SPRZEDAWCY:', 20, 134);
      doc.setFontSize(10);
      doc.text(`Imię i nazwisko: ${formData.sellerName}`, 20, 144);
      doc.text(`Adres e-mail: ${formData.sellerEmail}`, 20, 151);
      doc.text(`Telefon: ${formData.sellerPhone}`, 20, 158);
      doc.text(`Adres: ${formData.sellerAddress}`, 20, 165);
      
      // §1 Section
      doc.setFontSize(12);
      doc.text('§1 POSTANOWIENIA OGÓLNE', 20, 180);
      doc.setFontSize(9);
      const section1Text = [
        '1. Zobowiązany oświadcza, że nie została zawarta umowa sprzedaży samochodu',
        `z numerem VIN: ${formData.vinNumber} („Samochód") pomiędzy Zobowiązanym a Sprzedawcą.`,
        '2. Strony zgodnie oświadczają, że planowana umowa miała zostać zawarta',
        'za pośrednictwem Auto-Strada.pl po akceptacji oferty w ramach aukcji.',
        '3. Na mocy regulaminu serwisu, obie strony uzgodniły, że sprzedaż nie dojdzie',
        'do skutku, a Zobowiązany otrzyma zwrot prowizji.',
        '4. Zobowiązany zobowiązuje się nie zawierać umowy sprzedaży tego Samochodu',
        'z tym samym Sprzedawcą w ciągu 12 miesięcy bez uprzedniego uiszczenia prowizji Auto-Strada.',
        '5. W sprawach nieuregulowanych zastosowanie ma regulamin serwisu Auto-Strada.pl.'
      ];
      
      let yPos = 190;
      section1Text.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      
      // Add new page if needed
      doc.addPage();
      yPos = 20;
      
      // §2 Section
      doc.setFontSize(12);
      doc.text('§2 POWÓD ZA ODWOŁANIE SPRZEDAŻY', 20, yPos);
      yPos += 10;
      doc.setFontSize(9);
      doc.text('Proszę opisać dlaczego sprzedaż się nie odbywa:', 20, yPos);
      yPos += 10;
      const reasonLines = doc.splitTextToSize(formData.cancellationReason, 170);
      doc.text(reasonLines, 20, yPos);
      yPos += reasonLines.length * 7 + 10;
      
      // §3 Section
      doc.setFontSize(12);
      doc.text('§3 ZWROT PROWIZJI', 20, yPos);
      yPos += 10;
      doc.setFontSize(9);
      const section3Text = [
        `1. Prowizja zostanie zwrócona w ciągu ${formData.refundDays} dni roboczych od dnia:`,
        '- Akceptacji autentyczności tego wniosku, którego skan został przesłany',
        'na firmy@auto-strada.pl, razem ze zdjęciami potwierdzającymi powód na odwołanie sprzedaży',
        '2. Zwrot zostanie dokonany na rachunek bankowy, z którego dokonano pierwotnej płatności.',
        '3. Zobowiązany nie może domagać się odsetek od prowizji.'
      ];
      
      section3Text.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      yPos += 10;
      
      // §4 Section
      doc.setFontSize(12);
      doc.text('§4 KARA UMOWNA', 20, yPos);
      yPos += 10;
      doc.setFontSize(9);
      const section4Text = [
        '1. W przypadku naruszenia postanowień niniejszej umowy przez Zobowiązanego,',
        'Auto-Strada przysługuje kara umowna w wysokości dwukrotnej prowizji.',
        '2. Kara zostanie uiszczona w ciągu 3 dni roboczych od otrzymania wezwania do zapłaty.',
        '3. Naruszeniem jest m.in.:',
        '- zawarcie umowy sprzedaży z pominięciem prowizji,',
        '- zawarcie umowy przed upływem 12 miesięcy od podpisania niniejszego dokumentu.',
        '4. Auto-Strada zastrzega sobie prawo do dochodzenia odszkodowania przewyższającego karę.'
      ];
      
      section4Text.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      yPos += 10;
      
      // §5 Section
      doc.setFontSize(12);
      doc.text('§5 POSTANOWIENIA KOŃCOWE', 20, yPos);
      yPos += 10;
      doc.setFontSize(9);
      const section5Text = [
        '1. Umowa zawarta zostaje w formie dokumentowej.',
        '2. Wszelkie zmiany wymagają zgodnych oświadczeń w formie pisemnej.',
        '3. Strony dopuszczają kontakt mailowy.',
        '4. Postanowienia nieważne nie wpływają na ważność pozostałych.',
        '5. Spory rozstrzyga sąd właściwy dla siedziby Auto-Strada.',
        '6. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.'
      ];
      
      section5Text.forEach(line => {
        doc.text(line, 20, yPos);
        yPos += 7;
      });
      yPos += 20;
      
      // Signatures
      doc.setFontSize(12);
      doc.text('PODPISY STRON', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.text('ZOBOWIĄZANY (Kupujący):', 20, yPos);
      doc.text('SPRZEDAWCA:', 120, yPos);
      yPos += 15;
      
      doc.text('Podpis: _________________________________', 20, yPos);
      doc.text('Podpis: _________________________________', 120, yPos);
      yPos += 10;
      
      doc.text(`Data: ${formData.buyerSignatureDate}`, 20, yPos);
      doc.text(`Data: ${formData.sellerSignatureDate}`, 120, yPos);
      
      // Save the PDF
      doc.save(`umowa-lojalnosciowa-${formData.vinNumber || 'contract'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Sukces",
        description: "Umowa lojalnościowa została wygenerowana jako PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się wygenerować pliku PDF",
      });
    }
  };

  const generateWordDoc = () => {
    try {
      const content = `
UMOWA LOJALNOŚCIOWA

zawarta pomiędzy:

AUTO-STRADA (Tikoo Sp. z o.o.)
KRS: 0000351062
Adres: os. Przyjaźni 2/22, 84-200 Wejherowo
NIP: 5882346564 | REGON: 220989555
E-mail: firmy@auto-strada.pl

DANE NABYWCY (Zobowiązanego):
Imię i nazwisko: ${formData.buyerName}
Adres e-mail: ${formData.buyerEmail}
Telefon: ${formData.buyerPhone}
Adres: ${formData.buyerAddress}

DANE SPRZEDAWCY:
Imię i nazwisko: ${formData.sellerName}
Adres e-mail: ${formData.sellerEmail}
Telefon: ${formData.sellerPhone}
Adres: ${formData.sellerAddress}

§1 POSTANOWIENIA OGÓLNE

1. Zobowiązany oświadcza, że nie została zawarta umowa sprzedaży samochodu z numerem VIN: ${formData.vinNumber} („Samochód") pomiędzy Zobowiązanym a Sprzedawcą.
2. Strony zgodnie oświadczają, że planowana umowa miała zostać zawarta za pośrednictwem Auto-Strada.pl po akceptacji oferty w ramach aukcji.
3. Na mocy regulaminu serwisu, obie strony uzgodniły, że sprzedaż nie dojdzie do skutku, a Zobowiązany otrzyma zwrot prowizji.
4. Zobowiązany zobowiązuje się nie zawierać umowy sprzedaży tego Samochodu z tym samym Sprzedawcą w ciągu 12 miesięcy bez uprzedniego uiszczenia prowizji Auto-Strada.
5. W sprawach nieuregulowanych zastosowanie ma regulamin serwisu Auto-Strada.pl.

§2 POWÓD ZA ODWOŁANIE SPRZEDAŻY

Proszę opisać dlaczego sprzedaż się nie odbywa:
${formData.cancellationReason}

§3 ZWROT PROWIZJI

1. Prowizja zostanie zwrócona w ciągu ${formData.refundDays} dni roboczych od dnia:
- Akceptacji autentyczności tego wniosku, którego skan został przesłany na firmy@auto-strada.pl, razem ze zdjęciami potwierdzającymi powód na odwołanie sprzedaży
2. Zwrot zostanie dokonany na rachunek bankowy, z którego dokonano pierwotnej płatności.
3. Zobowiązany nie może domagać się odsetek od prowizji.

§4 KARA UMOWNA

1. W przypadku naruszenia postanowień niniejszej umowy przez Zobowiązanego, Auto-Strada przysługuje kara umowna w wysokości dwukrotnej prowizji.
2. Kara zostanie uiszczona w ciągu 3 dni roboczych od otrzymania wezwania do zapłaty.
3. Naruszeniem jest m.in.:
- zawarcie umowy sprzedaży z pominięciem prowizji,
- zawarcie umowy przed upływem 12 miesięcy od podpisania niniejszego dokumentu.
4. Auto-Strada zastrzega sobie prawo do dochodzenia odszkodowania przewyższającego karę.

§5 POSTANOWIENIA KOŃCOWE

1. Umowa zawarta zostaje w formie dokumentowej.
2. Wszelkie zmiany wymagają zgodnych oświadczeń w formie pisemnej.
3. Strony dopuszczają kontakt mailowy.
4. Postanowienia nieważne nie wpływają na ważność pozostałych.
5. Spory rozstrzyga sąd właściwy dla siedziby Auto-Strada.
6. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.

PODPISY STRON

ZOBOWIĄZANY (Kupujący):
Podpis: ___________________________________
Data: ${formData.buyerSignatureDate}

SPRZEDAWCA:
Podpis: ___________________________________
Data: ${formData.sellerSignatureDate}

Wygenerowano: ${new Date().toLocaleString('pl-PL')}
      `;
      
      const blob = new Blob([content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `umowa-lojalnosciowa-${formData.vinNumber || 'contract'}-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sukces",
        description: "Umowa lojalnościowa została wygenerowana jako dokument Word",
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        variant: "destructive",
        title: "Błąd",
        description: "Nie udało się wygenerować dokumentu Word",
      });
    }
  };

  const isFormValid = formData.buyerName && formData.buyerEmail && formData.sellerName && formData.vinNumber && formData.cancellationReason;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          Generator Umowy Lojalnościowej
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* Company Information - Read Only */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">AUTO-STRADA (Tikoo Sp. z o.o.)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>KRS:</strong> 0000351062</p>
              <p><strong>NIP:</strong> 5882346564</p>
              <p><strong>REGON:</strong> 220989555</p>
              <p><strong>E-mail:</strong> firmy@auto-strada.pl</p>
              <p className="md:col-span-2"><strong>Adres:</strong> os. Przyjaźni 2/22, 84-200 Wejherowo</p>
            </div>
          </div>

          {/* Buyer Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Dane Nabywcy (Zobowiązanego)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerName">Imię i nazwisko *</Label>
                <Input
                  id="buyerName"
                  value={formData.buyerName}
                  onChange={(e) => handleInputChange('buyerName', e.target.value)}
                  placeholder="Wprowadź imię i nazwisko nabywcy"
                />
              </div>
              <div>
                <Label htmlFor="buyerEmail">Adres e-mail *</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={formData.buyerEmail}
                  onChange={(e) => handleInputChange('buyerEmail', e.target.value)}
                  placeholder="Wprowadź adres e-mail nabywcy"
                />
              </div>
              <div>
                <Label htmlFor="buyerPhone">Telefon</Label>
                <Input
                  id="buyerPhone"
                  value={formData.buyerPhone}
                  onChange={(e) => handleInputChange('buyerPhone', e.target.value)}
                  placeholder="Wprowadź numer telefonu nabywcy"
                />
              </div>
              <div>
                <Label htmlFor="buyerAddress">Adres</Label>
                <Input
                  id="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
                  placeholder="Wprowadź adres nabywcy"
                />
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Dane Sprzedawcy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sellerName">Imię i nazwisko *</Label>
                <Input
                  id="sellerName"
                  value={formData.sellerName}
                  onChange={(e) => handleInputChange('sellerName', e.target.value)}
                  placeholder="Wprowadź imię i nazwisko sprzedawcy"
                />
              </div>
              <div>
                <Label htmlFor="sellerEmail">Adres e-mail</Label>
                <Input
                  id="sellerEmail"
                  type="email"
                  value={formData.sellerEmail}
                  onChange={(e) => handleInputChange('sellerEmail', e.target.value)}
                  placeholder="Wprowadź adres e-mail sprzedawcy"
                />
              </div>
              <div>
                <Label htmlFor="sellerPhone">Telefon</Label>
                <Input
                  id="sellerPhone"
                  value={formData.sellerPhone}
                  onChange={(e) => handleInputChange('sellerPhone', e.target.value)}
                  placeholder="Wprowadź numer telefonu sprzedawcy"
                />
              </div>
              <div>
                <Label htmlFor="sellerAddress">Adres</Label>
                <Input
                  id="sellerAddress"
                  value={formData.sellerAddress}
                  onChange={(e) => handleInputChange('sellerAddress', e.target.value)}
                  placeholder="Wprowadź adres sprzedawcy"
                />
              </div>
            </div>
          </div>

          {/* Contract Details */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Szczegóły Umowy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vinNumber">Numer VIN samochodu *</Label>
                <Input
                  id="vinNumber"
                  value={formData.vinNumber}
                  onChange={(e) => handleInputChange('vinNumber', e.target.value)}
                  placeholder="Wprowadź numer VIN"
                />
              </div>
              <div>
                <Label htmlFor="refundDays">Dni na zwrot prowizji</Label>
                <Input
                  id="refundDays"
                  value={formData.refundDays}
                  onChange={(e) => handleInputChange('refundDays', e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="cancellationReason">Powód odwołania sprzedaży *</Label>
              <Textarea
                id="cancellationReason"
                value={formData.cancellationReason}
                onChange={(e) => handleInputChange('cancellationReason', e.target.value)}
                placeholder="Proszę opisać dlaczego sprzedaż się nie odbywa..."
                rows={4}
              />
            </div>
          </div>

          {/* Signature Dates */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Daty Podpisów</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerSignatureDate">Data podpisu nabywcy</Label>
                <Input
                  id="buyerSignatureDate"
                  type="date"
                  value={formData.buyerSignatureDate}
                  onChange={(e) => handleInputChange('buyerSignatureDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sellerSignatureDate">Data podpisu sprzedawcy</Label>
                <Input
                  id="sellerSignatureDate"
                  type="date"
                  value={formData.sellerSignatureDate}
                  onChange={(e) => handleInputChange('sellerSignatureDate', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={generatePDF}
              disabled={!isFormValid}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Pobierz jako PDF
            </Button>
            <Button 
              onClick={generateWordDoc}
              disabled={!isFormValid}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Pobierz jako Word
            </Button>
          </div>
          
          {!isFormValid && (
            <p className="text-sm text-warning">
              Proszę wypełnić wszystkie wymagane pola (*) aby włączyć pobieranie.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
