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
  if (!filePath) return "/placeholder.svg";
  
  // If already a full URL, return as is
  if (filePath.startsWith('http')) return filePath;
  
  // Get public URL from Supabase Storage
  const { data } = supabase.storage
    .from('car-images')
    .getPublicUrl(filePath);
    
  return data?.publicUrl || "/placeholder.svg";
};

/**
 * Fetch car file uploads for multiple car IDs
 */
export const fetchCarFileUploads = async (carIds: string[]): Promise<CarFileUpload[]> => {
  if (!carIds.length) return [];
  
  try {
    const { data, error } = await supabase
      .from('car_file_uploads')
      .select('*')
      .in('car_id', carIds)
      .eq('upload_status', 'completed')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching car file uploads:', error);
      return [];
    }

    return (data as unknown as CarFileUpload[]) || [];
  } catch (error) {
    console.error('Error in fetchCarFileUploads:', error);
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
  if (!uploads.length) return "/placeholder.svg";
  
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
      return getStorageImageUrl(categoryImage.file_path);
    }
  }
  
  // If no priority category found, use first available image
  const firstImage = uploads[0];
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