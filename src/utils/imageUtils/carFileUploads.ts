import { supabase } from "@/integrations/supabase/client";

/**
 * Car file upload utilities for the new image architecture
 */

export interface CarFileUpload {
  id: string;
  car_id: string;
  file_path: string;
  category: string;
  display_order: number;
  file_type: string;
  upload_status: string;
  created_at: string;
}

/**
 * Convert file path to Supabase Storage public URL
 */
export const getStorageImageUrl = (filePath: string): string => {
  console.log('🔗 getStorageImageUrl called with filePath:', filePath);
  
  if (!filePath) {
    console.error('❌ Empty file path provided to getStorageImageUrl');
    return "";
  }
  
  // If already a full URL, return as is
  if (filePath.startsWith('http')) {
    console.log('✅ Already a full URL, returning as-is:', filePath);
    return filePath;
  }
  
  // Get public URL from Supabase Storage
  const { data } = supabase.storage
    .from('car-images')
    .getPublicUrl(filePath);
    
  const publicUrl = data?.publicUrl || "";
  console.log('🔗 Generated Supabase storage URL:', {
    filePath,
    publicUrl,
    hasData: !!data
  });
    
  return publicUrl;
};

/**
 * Fetch car file uploads for multiple car IDs with authentication debugging
 */
export const fetchCarFileUploads = async (carIds: string[]): Promise<CarFileUpload[]> => {
  console.log('📥 fetchCarFileUploads called with carIds:', carIds);
  
  if (!carIds.length) {
    console.log('⚠️ No car IDs provided to fetchCarFileUploads');
    return [];
  }
  
  try {
    // Ensure we have a fresh session and refresh if needed
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 Authentication state during fetchCarFileUploads:', {
      hasSession: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      userRole: sessionData.session?.user?.user_metadata?.role,
      sessionError: sessionError?.message,
      accessToken: sessionData.session?.access_token ? `${sessionData.session.access_token.substring(0, 20)}...` : 'none',
      expiresAt: sessionData.session?.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : 'unknown'
    });

    if (!sessionData.session) {
      console.error('❌ No authentication session found when fetching car file uploads');
      return [];
    }

    // Check if session is about to expire and refresh if needed
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = sessionData.session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry < 300) { // Less than 5 minutes
      console.log('🔄 Session expires soon, refreshing...', { timeUntilExpiry });
      const { data: refreshedSession } = await supabase.auth.refreshSession();
      if (!refreshedSession.session) {
        console.error('❌ Failed to refresh session');
        return [];
      }
    }

    // Make the query with proper error handling
    const { data, error } = await supabase
      .from('car_file_uploads')
      .select('*')
      .in('car_id', carIds)
      .eq('upload_status', 'completed')
      .order('display_order', { ascending: true });

    console.log('📥 Supabase query result:', {
      carIds,
      hasError: !!error,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      errorCode: error?.code,
      dataCount: data?.length || 0,
      sampleData: data?.slice(0, 2)
    });

    if (error) {
      console.error('❌ Error fetching car file uploads:', error);
      // Check if it's an RLS error
      if (error.message?.includes('row-level security') || error.code === 'PGRST116') {
        console.error('🚫 RLS Policy blocked access - authentication context not properly passed');
      }
      return [];
    }

    const result = (data as unknown as CarFileUpload[]) || [];
    console.log('✅ fetchCarFileUploads returning:', result.length, 'uploads');
    return result;
  } catch (error) {
    console.error('❌ Exception in fetchCarFileUploads:', error);
    return [];
  }
};

/**
 * Fetch car file uploads for a single car
 */
export const fetchCarFileUploadsById = async (carId: string): Promise<CarFileUpload[]> => {
  return fetchCarFileUploads([carId]);
};

/**
 * Organize car file uploads by category with priority ordering
 */
export const organizeImagesByCategory = (uploads: CarFileUpload[]): Record<string, CarFileUpload[]> => {
  const categorized: Record<string, CarFileUpload[]> = {};
  
  uploads.forEach(upload => {
    const category = upload.category || 'additional';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(upload);
  });
  
  // Sort each category by display_order
  Object.keys(categorized).forEach(category => {
    categorized[category].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  });
  
  return categorized;
};

/**
 * Get primary image from car file uploads (prioritize exterior photos)
 */
export const getPrimaryImageFromUploads = (uploads: CarFileUpload[]): string => {
  console.log('📸 getPrimaryImageFromUploads called with uploads:', {
    uploadsCount: uploads.length,
    uploads: uploads.map(u => ({ 
      id: u.id, 
      category: u.category, 
      file_path: u.file_path,
      upload_status: u.upload_status 
    }))
  });

  if (!uploads.length) {
    console.error('❌ No uploads provided to getPrimaryImageFromUploads');
    return "";
  }
  
  // Priority order for categories
  const categoryPriority = [
    'exterior_front',
    'exterior_rear', 
    'exterior_left',
    'exterior_right',
    'interior_front',
    'interior_rear',
    'engine_bay',
    'dashboard'
  ];
  
  // Find first image in priority order
  for (const category of categoryPriority) {
    const categoryImage = uploads.find(upload => upload.category === category);
    if (categoryImage) {
      console.log('✅ Found image in priority category:', category, categoryImage);
      return getStorageImageUrl(categoryImage.file_path);
    }
  }
  
  // If no priority category found, use first available image
  const firstImage = uploads[0];
  console.log('⚠️ No priority category found, using first image:', firstImage);
  return getStorageImageUrl(firstImage.file_path);
};

/**
 * Get all images from car file uploads with proper labeling
 */
export const getAllImagesFromUploads = (uploads: CarFileUpload[]): { src: string; label: string }[] => {
  if (!uploads.length) return [];
  
  return uploads.map(upload => ({
    src: getStorageImageUrl(upload.file_path),
    label: (upload.category || 'additional').replace(/_/g, ' ').toUpperCase()
  }));
};

/**
 * Count valid images from car file uploads
 */
export const getImageCountFromUploads = (uploads: CarFileUpload[]): number => {
  return uploads.filter(upload => upload.file_path && upload.upload_status === 'completed').length;
};