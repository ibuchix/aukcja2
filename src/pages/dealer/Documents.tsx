
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import Navbar from "@/components/Navbar";
import { LoyaltyAgreementForm } from "@/components/dealer/documents/LoyaltyAgreementForm";
import { VerificationSuccessCard } from "@/components/dealer/documents/VerificationSuccessCard";
import { UtilityBillUpload } from "@/components/dealer/documents/UtilityBillUpload";
import { UtilityBillPendingStatus } from "@/components/dealer/documents/UtilityBillPendingStatus";
import { AdditionalDocumentsUpload } from "@/components/dealer/documents/AdditionalDocumentsUpload";
import { UploadedDocumentsList } from "@/components/dealer/documents/UploadedDocumentsList";
import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { 
  getDealerDocuments, 
  DealerDocument 
} from "@/services/dealerProfileManagementService";
import { useToast } from "@/hooks/use-toast";

export default function DealerDocuments() {
  const [documents, setDocuments] = useState<DealerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get dealer profile and verification status
  const { dealerProfile, isLoading: profileLoading } = useDealerProfileSimple();
  const isVerified = dealerProfile?.verification_status === 'approved' || dealerProfile?.is_verified === true;
  
  // Check if utility bill documents have been uploaded
  const hasUtilityBillUploaded = documents.some(doc => doc.document_type === 'utility-bill');

  // Document upload functionality
  const {
    file,
    documentType,
    uploadLoading,
    setDocumentType,
    handleFileChange,
    handleUtilityBillFileChange,
    handleUpload
  } = useDocumentUpload();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      fetchDocuments();
    };
    checkAuth();
  }, [navigate]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const result = await getDealerDocuments();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setDocuments(result.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchDocuments();
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6 text-body-text">Centrum Dokumentów</h1>
        
        {/* Show verification success message for verified dealers */}
        {isVerified && <VerificationSuccessCard />}
        
        {/* Show utility bill pending status if uploaded but not verified */}
        {!isVerified && hasUtilityBillUploaded && <UtilityBillPendingStatus />}
        
        {/* Only show upload sections for unverified dealers who haven't uploaded utility bill */}
        {!isVerified && !hasUtilityBillUploaded && (
          <UtilityBillUpload
            file={file}
            uploadLoading={uploadLoading}
            onFileChange={handleUtilityBillFileChange}
            onUpload={() => handleUpload(handleUploadSuccess)}
          />
        )}
        
        {/* Additional documents upload - shown for all unverified dealers */}
        {!isVerified && (
          <AdditionalDocumentsUpload
            file={file}
            documentType={documentType}
            uploadLoading={uploadLoading}
            onFileChange={handleFileChange}
            onDocumentTypeChange={setDocumentType}
            onUpload={() => handleUpload(handleUploadSuccess)}
          />
        )}
        
        {/* Loyalty Agreement Form Section - shown for all dealers */}
        <div className="mb-8">
          <LoyaltyAgreementForm />
        </div>
        
        {/* Document list - shown for all dealers */}
        <UploadedDocumentsList documents={documents} />
      </div>
    </div>
  );
}
