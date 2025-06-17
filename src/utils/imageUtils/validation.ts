
/**
 * Image validation utilities
 */

/**
 * Check if a URL is a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Reject blob URLs - they should not be in the database
  if (url.startsWith('blob:')) {
    console.warn('Blob URL detected - this should not be stored in database:', url);
    return false;
  }
  
  // Data URLs are valid
  if (url.startsWith('data:image/')) return true;
  
  // HTTP/HTTPS URLs are valid
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  
  // Relative paths are valid
  if (url.startsWith('/')) return true;
  
  return false;
};
