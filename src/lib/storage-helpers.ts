/**
 * Storage Helper Functions (Barrel Export)
 * 
 * Re-exports all storage helpers for easier imports.
 * Actual implementation is in ./storage/storage-helpers.ts
 */

export {
  uploadToBucket,
  uploadCfdiXml,
  getSignedUrl,
  getCfdiSignedUrl,
  deleteFromBucket,
  extractFileMetadata,
  buildPath,
  buildCfdiPath,
  toYYYYMM
} from './storage/storage-helpers';

export { BUCKETS, requiresSignedUrl } from './storage/buckets';
export type { BucketName } from './storage/buckets';
