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
 * Strict category ordering for auction image display
 * This order is enforced for all car listings - 22 total slots
 */
const IMAGE_CATEGORY_ORDER: Record<string, number> = {
  'exterior_front': 1,       // Przód samochodu - Front of car
  'walkaround_video': 2,     // VID OF CAR - Walk around video
  'exterior_rear': 3,        // Tył samochodu - Back of car
  'exterior_left': 4,        // Bok kierowcy - Driver's side
  'exterior_right': 5,       // Bok pasażera - Passenger's side
  'interior_front': 6,       // Przednia część wnętrza - Front interior
  'dashboard': 7,            // Deska rozdzielcza - Dashboard
  'interior_rear': 8,        // Tylna część wnętrza - Back interior
  'engine_bay': 9,           // Komora silnika - Engine bay
  'oil_cap_underneath': 10,  // Zdjęcie spodu korka oleju (optional)
  'rim_front_left': 11,      // Przednia felga kierowcy - Driver front rim
  'rim_front_right': 12,     // Przednia felga pasażera - Passenger front rim
  'rim_rear_left': 13,       // Tylna felga kierowcy - Driver rear rim
  'rim_rear_right': 14,      // Tylna felga pasażera - Passenger rear rim
  // Additional optional photos (15-22)
  'additional_1': 15,
  'additional_2': 16,
  'additional_3': 17,
  'additional_4': 18,
  'additional_5': 19,
  'additional_6': 20,
  'additional_7': 21,
  'additional_8': 22,
};

/**
 * Get priority for a category (unknown categories go to end)
 */
const getCategoryPriority = (category: string): number => {
  return IMAGE_CATEGORY_ORDER[category] ?? 999;
};

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
  
  try {
    // Use RPC that returns JSONB to bypass client-side RLS filtering
    const { data, error } = await supabase
      .rpc('get_car_images_for_dealers', { 
        p_car_ids: carIds 
      });

    if (error) {
      console.error('❌ [CAR FILE UPLOADS ERROR]', error);
      return [];
    }

    // Parse JSONB response (comes back as a JSON array)
    const result = (data as any) || [];
    
    console.log('✅ [CAR FILE UPLOADS RPC RESPONSE]', {
      totalUploads: result.length,
      affectedCars: [...new Set(result.map((u: any) => u.car_id))].length
    });

    return result as CarFileUpload[];
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
 * Organize car file uploads by category with strict priority ordering
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
  
  // Sort each category's images by display_order
  Object.keys(categorized).forEach(category => {
    categorized[category].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  });
  
  // Return with categories in strict priority order
  const orderedResult: Record<string, CarFileUpload[]> = {};
  Object.keys(categorized)
    .sort((a, b) => getCategoryPriority(a) - getCategoryPriority(b))
    .forEach(key => {
      orderedResult[key] = categorized[key];
    });
  
  return orderedResult;
};

/**
 * Get primary image from car file uploads (strict category order - exterior_front first)
 */
export const getPrimaryImageFromUploads = (uploads: CarFileUpload[]): string => {
  if (!uploads.length) {
    return "";
  }
  
  // Filter to images only (exclude videos for primary image)
  // Sort by strict category priority order
  const sortedUploads = [...uploads]
    .filter(u => u.file_type?.startsWith('image/'))
    .sort((a, b) => {
      const priorityA = getCategoryPriority(a.category);
      const priorityB = getCategoryPriority(b.category);
      return priorityA - priorityB;
    });
  
  if (!sortedUploads.length) {
    return "";
  }
  
  // Return the first image by category priority (exterior_front)
  const firstImage = sortedUploads[0];
  return getStorageImageUrl(firstImage.file_path);
};

/**
 * Get all images from car file uploads with proper labeling (strict category order)
 */
export const getAllImagesFromUploads = (uploads: CarFileUpload[]): { src: string; label: string; fileType?: string }[] => {
  if (!uploads.length) return [];
  
  // Sort by strict category priority order
  const sortedUploads = [...uploads].sort((a, b) => {
    const priorityA = getCategoryPriority(a.category);
    const priorityB = getCategoryPriority(b.category);
    
    // Primary sort: category priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Secondary sort: display_order within same category
    return (a.display_order || 0) - (b.display_order || 0);
  });
  
  return sortedUploads.map((upload, index) => ({
    src: getStorageImageUrl(upload.file_path),
    label: `IMAGE ${index + 1}`, // Sequential numbering based on sorted order
    fileType: upload.file_type || undefined
  }));
};

/**
 * Count valid images from car file uploads
 */
export const getImageCountFromUploads = (uploads: CarFileUpload[]): number => {
  return uploads.filter(upload => upload.file_path && upload.upload_status === 'completed').length;
};

/**
 * Generate a signed URL for video playback
 * Signed URLs are more reliable for video streaming than public URLs
 * because they handle special characters properly and bypass CORS issues
 */
export const getSignedVideoUrl = async (filePath: string): Promise<string> => {
  if (!filePath) return '';
  
  let actualPath = filePath;
  
  // If already a full URL, extract the path after the bucket name
  if (filePath.includes('/storage/v1/object/public/car-images/')) {
    const match = filePath.match(/\/storage\/v1\/object\/public\/car-images\/(.+)/);
    if (match) {
      actualPath = decodeURIComponent(match[1]);
    }
  } else if (filePath.includes('/storage/v1/object/sign/car-images/')) {
    // Already a signed URL path, extract properly
    const match = filePath.match(/\/storage\/v1\/object\/sign\/car-images\/(.+?)(\?|$)/);
    if (match) {
      actualPath = decodeURIComponent(match[1]);
    }
  }
  
  console.log('🎬 Generating signed URL for video:', { originalPath: filePath, actualPath });
  
  try {
    const { data, error } = await supabase.storage
      .from('car-images')
      .createSignedUrl(actualPath, 3600); // 1 hour expiry
    
    if (error || !data?.signedUrl) {
      console.error('❌ Failed to create signed URL:', error);
      return filePath; // Fallback to original URL
    }
    
    console.log('✅ Signed URL generated successfully');
    return data.signedUrl;
  } catch (error) {
    console.error('❌ Exception generating signed URL:', error);
    return filePath;
  }
};