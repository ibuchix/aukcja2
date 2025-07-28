
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import Navbar from "@/components/Navbar";
import { LoyaltyAgreementForm } from "@/components/dealer/documents/LoyaltyAgreementForm";
import { VerificationSuccessCard } from "@/components/dealer/documents/VerificationSuccessCard";
import { UtilityBillUpload } from "@/components/dealer/documents/UtilityBillUpload";
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
        <h1 className="text-3xl font-bold mb-6 text-body-text">Document Management</h1>
        
        {/* Show verification success message for verified dealers */}
        {isVerified && <VerificationSuccessCard />}
        
        {/* Only show upload sections for unverified dealers */}
        {!isVerified && (
          <>
            <UtilityBillUpload
              file={file}
              uploadLoading={uploadLoading}
              onFileChange={handleUtilityBillFileChange}
              onUpload={() => handleUpload(handleUploadSuccess)}
            />
            
            <AdditionalDocumentsUpload
              file={file}
              documentType={documentType}
              uploadLoading={uploadLoading}
              onFileChange={handleFileChange}
              onDocumentTypeChange={setDocumentType}
              onUpload={() => handleUpload(handleUploadSuccess)}
            />
          </>
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
