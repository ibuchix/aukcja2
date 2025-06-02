
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, Download } from "lucide-react";
import jsPDF from 'jspdf';
import { useToast } from "@/components/ui/use-toast";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";

interface CancellationFormData {
  dealerName: string;
  dealershipName: string;
  email: string;
  phone: string;
  reason: string;
  additionalComments: string;
  effectiveDate: string;
}

export function CancellationForm() {
  const { dealerProfile } = useDealerProfileSimple();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CancellationFormData>({
    dealerName: dealerProfile?.supervisor_name || '',
    dealershipName: dealerProfile?.dealership_name || '',
    email: '',
    phone: '',
    reason: '',
    additionalComments: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (field: keyof CancellationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Dealer Cancellation Form', 20, 30);
      
      // Form content
      doc.setFontSize(12);
      doc.text(`Dealer Name: ${formData.dealerName}`, 20, 60);
      doc.text(`Dealership Name: ${formData.dealershipName}`, 20, 75);
      doc.text(`Email: ${formData.email}`, 20, 90);
      doc.text(`Phone: ${formData.phone}`, 20, 105);
      doc.text(`Reason for Cancellation: ${formData.reason}`, 20, 120);
      doc.text(`Effective Date: ${formData.effectiveDate}`, 20, 135);
      
      // Additional comments (with text wrapping)
      if (formData.additionalComments) {
        doc.text('Additional Comments:', 20, 155);
        const splitComments = doc.splitTextToSize(formData.additionalComments, 170);
        doc.text(splitComments, 20, 170);
      }
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 280);
      
      // Save the PDF
      doc.save(`cancellation-form-${formData.dealershipName || 'dealer'}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Success",
        description: "Cancellation form downloaded successfully as PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    }
  };

  const generateWordDoc = () => {
    try {
      const content = `
DEALER CANCELLATION FORM

Dealer Information:
- Dealer Name: ${formData.dealerName}
- Dealership Name: ${formData.dealershipName}
- Email: ${formData.email}
- Phone: ${formData.phone}

Cancellation Details:
- Reason for Cancellation: ${formData.reason}
- Effective Date: ${formData.effectiveDate}

Additional Comments:
${formData.additionalComments}

Generated on: ${new Date().toLocaleDateString()}
      `;
      
      const blob = new Blob([content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cancellation-form-${formData.dealershipName || 'dealer'}-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Cancellation form downloaded successfully as Word document",
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate Word document",
      });
    }
  };

  const isFormValid = formData.dealerName && formData.dealershipName && formData.email && formData.reason && formData.effectiveDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          Cancellation Form Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dealerName">Dealer Name *</Label>
              <Input
                id="dealerName"
                value={formData.dealerName}
                onChange={(e) => handleInputChange('dealerName', e.target.value)}
                placeholder="Enter dealer name"
              />
            </div>
            <div>
              <Label htmlFor="dealershipName">Dealership Name *</Label>
              <Input
                id="dealershipName"
                value={formData.dealershipName}
                onChange={(e) => handleInputChange('dealershipName', e.target.value)}
                placeholder="Enter dealership name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reason">Reason for Cancellation *</Label>
              <Select value={formData.reason} onValueChange={(value) => handleInputChange('reason', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="business-closure">Business Closure</SelectItem>
                  <SelectItem value="financial-constraints">Financial Constraints</SelectItem>
                  <SelectItem value="service-dissatisfaction">Service Dissatisfaction</SelectItem>
                  <SelectItem value="relocation">Business Relocation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="effectiveDate">Effective Date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="additionalComments">Additional Comments</Label>
            <Textarea
              id="additionalComments"
              value={formData.additionalComments}
              onChange={(e) => handleInputChange('additionalComments', e.target.value)}
              placeholder="Enter any additional comments or details"
              rows={4}
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button 
              onClick={generatePDF}
              disabled={!isFormValid}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download as PDF
            </Button>
            <Button 
              onClick={generateWordDoc}
              disabled={!isFormValid}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download as Word
            </Button>
          </div>
          
          {!isFormValid && (
            <p className="text-sm text-warning">
              Please fill in all required fields (*) to enable download.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
