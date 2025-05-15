
/**
 * Sanitize and validate registration metadata
 */
export function sanitizeMetadata(metadata: any): any {
  return {
    name: sanitizeString(metadata.name),
    companyName: sanitizeString(metadata.companyName),
    taxId: sanitizeString(metadata.taxId),
    businessRegistryNumber: sanitizeString(metadata.businessRegistryNumber),
    companyAddress: sanitizeString(metadata.companyAddress),
    phoneNumber: sanitizeString(metadata.phoneNumber)
  };
}

/**
 * Sanitize a string value
 */
export function sanitizeString(value: any): string {
  if (typeof value !== "string") return "";
  return value.trim();
}
