
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { uploadDealerDocument } from "@/services/dealerProfileManagementService";

export function useDocumentUpload() {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Validate file type for utility bills
      if (documentType === 'utility-bill') {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(selectedFile.type)) {
          toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Utility bills must be in PDF, JPG, or PNG format"
          });
          return;
        }
        
        // Check file size (max 10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: "File size must be less than 10MB"
          });
          return;
        }
      }
      
      setFile(selectedFile);
    }
  }, [documentType, toast]);

  const handleUpload = useCallback(async (onSuccess?: () => void) => {
    if (!file || !documentType) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file and document type"
      });
      return;
    }

    try {
      setUploadLoading(true);
      const result = await uploadDealerDocument({
        file,
        documentType
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Sukces",
        description: "Dokument został przesłany pomyślnie",
        variant: "default"
      });
      
      // Reset form
      setFile(null);
      setDocumentType("");
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload document"
      });
    } finally {
      setUploadLoading(false);
    }
  }, [file, documentType, toast]);

  const handleUtilityBillFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentType('utility-bill');
    handleFileChange(e);
  }, [handleFileChange]);

  return {
    file,
    documentType,
    uploadLoading,
    setDocumentType,
    handleFileChange,
    handleUtilityBillFileChange,
    handleUpload
  };
}
