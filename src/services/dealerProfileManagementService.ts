
import { supabase } from "@/integrations/supabase/client";

export interface ProfileUpdateData {
  supervisorName: string;
  dealershipName: string;
  address: string;
  phoneNumber?: string;
}

export interface DocumentUploadParams {
  file: File;
  documentType: string;
}

export interface DealerDocument {
  id: string;
  dealer_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  document_type: string;
  uploaded_at: string;
  verified: boolean;
  verification_notes?: string;
  signedUrl?: string;
  created_at: string;
  updated_at: string;
}

export async function updateDealerProfile(profileData: ProfileUpdateData) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const response = await supabase.functions.invoke('dealer-profile/update-profile', {
      body: {
        token: sessionData.session.access_token,
        dealerData: profileData
      }
    });

    if (response.error) {
      console.error("Profile update error:", response.error);
      return {
        success: false,
        error: response.error.message || "Failed to update profile"
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export async function uploadDealerDocument({ file, documentType }: DocumentUploadParams) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    // Validate utility bill specific requirements
    if (documentType === 'utility-bill') {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: "Utility bills must be in PDF, JPG, or PNG format"
        };
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return {
          success: false,
          error: "File size must be less than 10MB"
        };
      }
    }

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('token', sessionData.session.access_token);

    const response = await supabase.functions.invoke('dealer-profile/upload-document', {
      body: formData
    });

    if (response.error) {
      console.error("Document upload error:", response.error);
      return {
        success: false,
        error: response.error.message || "Failed to upload document"
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

export async function getDealerDocuments() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return {
        success: false,
        error: "User not authenticated"
      };
    }

    const response = await supabase.functions.invoke('dealer-profile/get-documents', {
      body: { token: sessionData.session.access_token }
    });

    if (response.error) {
      console.error("Document fetch error:", response.error);
      return {
        success: false,
        error: response.error.message || "Failed to fetch documents"
      };
    }

    return {
      success: true,
      documents: response.data.documents as DealerDocument[]
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
