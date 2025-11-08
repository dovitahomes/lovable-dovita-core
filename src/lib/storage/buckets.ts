/**
 * Storage Buckets Configuration
 * 
 * Defines all available storage buckets and their privacy settings.
 * All buckets are private by default and require signed URLs for access.
 */

export const BUCKETS = {
  documentos: { private: true },
  project_docs: { private: true },
  project_photos: { private: true },
  'design-deliverables': { private: true },
  'construction-photos': { private: true },
  cfdi: { private: true },
  firmas: { private: true },
  'crm-attachments': { private: true },
} as const;

export type BucketName = keyof typeof BUCKETS;

/**
 * Check if a bucket requires signed URLs for access
 */
export function requiresSignedUrl(bucket: BucketName): boolean {
  return BUCKETS[bucket].private;
}
