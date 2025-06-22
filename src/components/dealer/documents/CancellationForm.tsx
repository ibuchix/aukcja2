
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileDown, FileText, Building } from "lucide-react";
import jsPDF from "jspdf";

interface CancellationFormData {
  dealerName: string;
  dealershipName: string;
  address: string;
  phoneNumber: string;
  email: string;
  reason: string;
  effectiveDate: string;
}

export const CancellationForm: React.FC = () => {
  const [formData, setFormData] = useState<CancellationFormData>({
    dealerName: '',
    dealershipName: '',
    address: '',
    phoneNumber: '',
    email: '',
    reason: '',
    effectiveDate: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof CancellationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateCancellationDocument = () => {
    if (!formData.dealerName || !formData.dealershipName || !formData.effectiveDate) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create new PDF document with proper margins
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Define brand colors
      const primaryRed = [220, 20, 60]; // #DC143C
      const darkGray = [56, 59, 57]; // #383B39
      const lightGray = [245, 245, 245];
      
      // Set up fonts (using available fonts in jsPDF)
      doc.setFont('helvetica', 'bold');
      
      // Header section with brand styling
      doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.rect(0, 0, 210, 25, 'F');
      
      // Company logo placeholder and name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('DEALERSHIP PORTAL', 20, 16);
      
      // Subtitle
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Professional Vehicle Auction Platform', 20, 21);
      
      // Document title
      doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DEALER AGREEMENT CANCELLATION', 20, 40);
      
      // Decorative line
      doc.setDrawColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.setLineWidth(0.5);
      doc.line(20, 45, 190, 45);
      
      // Document date and reference
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-GB');
      doc.text(`Document Date: ${currentDate}`, 20, 55);
      doc.text(`Reference: CANC-${Date.now().toString().slice(-6)}`, 130, 55);
      
      // Main content section
      let yPosition = 70;
      
      // Dealer Information Section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(20, yPosition, 170, 8, 'F');
      
      doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DEALER INFORMATION', 22, yPosition + 5);
      
      yPosition += 15;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const dealerInfo = [
        `Dealer Name: ${formData.dealerName}`,
        `Dealership: ${formData.dealershipName}`,
        `Address: ${formData.address}`,
        `Phone: ${formData.phoneNumber}`,
        `Email: ${formData.email}`
      ];
      
      dealerInfo.forEach(info => {
        if (info.split(': ')[1]) { // Only show if value exists
          doc.text(info, 22, yPosition);
          yPosition += 6;
        }
      });
      
      yPosition += 10;
      
      // Cancellation Details Section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(20, yPosition, 170, 8, 'F');
      
      doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CANCELLATION DETAILS', 22, yPosition + 5);
      
      yPosition += 15;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Effective Date: ${formData.effectiveDate}`, 22, yPosition);
      yPosition += 10;
      
      if (formData.reason) {
        doc.text('Reason for Cancellation:', 22, yPosition);
        yPosition += 6;
        
        // Handle multi-line reason text
        const reasonLines = doc.splitTextToSize(formData.reason, 160);
        reasonLines.forEach((line: string) => {
          doc.text(line, 22, yPosition);
          yPosition += 5;
        });
      }
      
      yPosition += 15;
      
      // Terms and Conditions Section
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(20, yPosition, 170, 8, 'F');
      
      doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS & CONDITIONS', 22, yPosition + 5);
      
      yPosition += 15;
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const terms = [
        '1. This cancellation request is subject to review and approval by our team.',
        '2. All outstanding obligations must be fulfilled before cancellation takes effect.',
        '3. Any pending transactions will be completed according to existing terms.',
        '4. Refunds, if applicable, will be processed within 14 business days.',
        '5. Access to platform services will be terminated on the effective date.'
      ];
      
      terms.forEach(term => {
        const termLines = doc.splitTextToSize(term, 160);
        termLines.forEach((line: string) => {
          doc.text(line, 22, yPosition);
          yPosition += 4;
        });
        yPosition += 2;
      });
      
      yPosition += 10;
      
      // Signature Section
      doc.setDrawColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.setLineWidth(0.3);
      doc.line(22, yPosition, 90, yPosition);
      doc.line(120, yPosition, 188, yPosition);
      
      yPosition += 5;
      doc.setFontSize(9);
      doc.text('Dealer Signature', 22, yPosition);
      doc.text('Date', 120, yPosition);
      
      // Footer
      const footerY = 280;
      doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
      doc.rect(0, footerY, 210, 17, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('For questions regarding this cancellation, contact: support@dealershipportal.com', 20, footerY + 6);
      doc.text('This document was generated electronically and is valid without signature.', 20, footerY + 11);
      
      // Generate filename and save
      const filename = `Cancellation_${formData.dealershipName.replace(/\s+/g, '_')}_${currentDate.replace(/\//g, '-')}.pdf`;
      doc.save(filename);
      
      toast({
        title: "Document Generated",
        description: "Your cancellation document has been downloaded successfully",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "There was an error generating the document. Please try again."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-[#DC143C]/20">
      <CardHeader className="bg-[#DC143C]/5">
        <CardTitle className="flex items-center gap-2 text-[#DC143C]">
          <FileText className="w-6 h-6" />
          Generate Cancellation Document
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="dealerName">Dealer Name *</Label>
            <Input
              id="dealerName"
              value={formData.dealerName}
              onChange={(e) => handleInputChange('dealerName', e.target.value)}
              placeholder="Enter your full name"
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
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter business address"
            />
          </div>
          
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
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
          <Label htmlFor="reason">Reason for Cancellation</Label>
          <Textarea
            id="reason"
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            placeholder="Please provide reason for cancellation (optional)"
            rows={3}
          />
        </div>
        
        <div className="flex justify-end pt-4">
          <Button
            onClick={generateCancellationDocument}
            disabled={isGenerating}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            {isGenerating ? (
              <>
                <Building className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Generate Document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
