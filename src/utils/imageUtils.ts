
// Main imageUtils.ts file - now just re-exports from modular files
export {
  isValidImageUrl,
  transformImageUrl,
  fetchImagesFromStorage,
  getPrimaryImage,
  getAllCarImages,
  getImageCount,
  uploadCarImageToStorage,
  debugCarImages
} from "./imageUtils/index";
