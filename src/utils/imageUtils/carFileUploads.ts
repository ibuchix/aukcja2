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
 * Supports both 'car-images' and 'manual-valuation-photos' buckets
 */
export const getStorageImageUrl = (filePath: string): string => {
  if (!filePath) {
    return "";
  }
  
  // If already a full URL, return as is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  let bucketName = 'car-images'; // Default fallback
  let actualFilePath = filePath;
  
  // Detect bucket based on path structure
  // Files with 'manual-valuations/' prefix are stored in 'manual-valuation-photos' bucket
  // (manual-valuations is a folder prefix inside the bucket, not the bucket name itself)
  if (filePath.startsWith('manual-valuations/')) {
    bucketName = 'manual-valuation-photos';
    actualFilePath = filePath; // Keep full path including folder prefix
  }
  
  console.log('🪣 Bucket detection:', { 
    originalPath: filePath, 
    detectedBucket: bucketName, 
    actualFilePath 
  });
  
  // Get public URL from Supabase Storage with detected bucket
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(actualFilePath);
     
  const publicUrl = data?.publicUrl || "";
  
  console.log('🖼️ Generated public URL:', publicUrl);
     
  return publicUrl;
};

/**
 * Fetch car file uploads for multiple car IDs using RPC function
 * This bypasses RLS authentication issues by using server-side authorization
 */
export const fetchCarFileUploads = async (carIds: string[]): Promise<CarFileUpload[]> => {
  if (!carIds.length) {
    console.log('⚠️ fetchCarFileUploads called with empty car IDs');
    return [];
  }
  
  console.log('🔍 [FETCH CAR FILE UPLOADS] Requesting images for', carIds.length, 'cars');
  console.log('📋 [CAR IDS SAMPLE]', carIds.slice(0, 5));
  
  try {
    // Use the new RPC function that handles authentication server-side
    const { data, error } = await supabase
      .rpc('get_car_images_for_dealers', { 
        p_car_ids: carIds 
      });

    if (error) {
      console.error('❌ [CAR FILE UPLOADS ERROR]', error);
      return [];
    }

    const result = (data as unknown as CarFileUpload[]) || [];
    
    console.log('✅ [CAR FILE UPLOADS RPC RESPONSE]', {
      totalUploads: result.length,
      uploadsByCar: result.reduce((acc: Record<string, number>, upload: CarFileUpload) => {
        acc[upload.car_id] = (acc[upload.car_id] || 0) + 1;
        return acc;
      }, {})
    });

    // Check specifically for the problematic Alfa Romeo Tonale
    const tonaleUploads = result.filter(u => u.car_id === 'c255a006-eb33-47e3-ba4e-5f024e41b57e');
    if (tonaleUploads.length > 0) {
      console.log('🔎 [TONALE FOUND IN RESPONSE]', {
        tonaleCarId: 'c255a006-eb33-47e3-ba4e-5f024e41b57e',
        tonaleUploadsCount: tonaleUploads.length,
        categories: tonaleUploads.map(u => u.category),
        uploadStatuses: tonaleUploads.map(u => u.upload_status),
      });
    } else {
      console.warn('⚠️ [TONALE NOT IN RESPONSE] No uploads found for c255a006-eb33-47e3-ba4e-5f024e41b57e');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Exception in fetchCarFileUploads (RPC):', error);
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
 * Get primary image from car file uploads (ordered by upload sequence)
 */
export const getPrimaryImageFromUploads = (uploads: CarFileUpload[]): string => {
  if (!uploads.length) {
    return "";
  }
  
  // Sort by upload order: first by display_order, then by created_at as fallback
  const sortedUploads = [...uploads].sort((a, b) => {
    // First sort by display_order (lower numbers first)
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    // Fallback to created_at timestamp (earlier uploads first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  // Return the first image in upload order
  const firstImage = sortedUploads[0];
  return getStorageImageUrl(firstImage.file_path);
};

/**
 * Get all images from car file uploads with proper labeling (ordered by upload sequence)
 */
export const getAllImagesFromUploads = (uploads: CarFileUpload[]): { src: string; label: string }[] => {
  if (!uploads.length) return [];
  
  // Sort by upload order: first by display_order, then by created_at as fallback
  const sortedUploads = [...uploads].sort((a, b) => {
    // First sort by display_order (lower numbers first)
    if (a.display_order !== b.display_order) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    // Fallback to created_at timestamp (earlier uploads first)
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  return sortedUploads.map((upload, index) => ({
    src: getStorageImageUrl(upload.file_path),
    label: `IMAGE ${index + 1}` // Simple sequential numbering based on upload order
  }));
};

/**
 * Count valid images from car file uploads
 */
export const getImageCountFromUploads = (uploads: CarFileUpload[]): number => {
  return uploads.filter(upload => upload.file_path && upload.upload_status === 'completed').length;
};