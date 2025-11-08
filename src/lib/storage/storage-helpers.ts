/**
 * Storage Helper Functions
 * 
 * Provides standardized functions for uploading files to Supabase Storage
 * and retrieving signed URLs for private buckets.
 */

import { supabase } from "@/integrations/supabase/client";
import type { BucketName } from "./buckets";

interface UploadParams {
  bucket: BucketName;
  projectId: string;
  file: File;
  filename?: string;
}

interface SignedUrlParams {
  bucket: BucketName;
  path: string;
  expiresInSeconds?: number;
}

interface CfdiPathParams {
  scope: string; // RFC del emisor
  yymm: string;  // YYMM format
  uuid: string;  // UUID único
  filename: string;
}

/**
 * Convert Date to YYMM format (e.g., "2501" for January 2025)
 * 
 * @param date - Date object
 * @returns String in YYMM format
 */
export function toYYMM(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yy}${mm}`;
}

/**
 * Build a storage path following CFDI conventions
 * Format: scope/YYMM-uuid-filename
 * 
 * @param params - Path parameters
 * @returns Standardized path string
 */
export function buildCfdiPath(params: CfdiPathParams): string {
  const { scope, yymm, uuid, filename } = params;
  return `${scope}/${yymm}-${uuid}-${filename}`;
}

/**
 * Generate a standardized storage path for projects
 * Format: projectId/YYMM-uuid-slugified-filename.ext
 * 
 * @param projectId - The project UUID
 * @param filename - Original filename
 * @returns Standardized path string
 */
export function buildPath(projectId: string, filename: string): string {
  const now = new Date();
  const yymm = toYYMM(now);
  
  const uuid = crypto.randomUUID();
  
  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  const ext = lastDotIndex > -1 ? filename.slice(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > -1 ? filename.slice(0, lastDotIndex) : filename;
  
  // Slugify: lowercase, replace spaces/special chars with dashes
  const slugified = nameWithoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  
  return `${projectId}/${yymm}-${uuid}-${slugified}${ext}`;
}

/**
 * Upload a file to a Supabase Storage bucket
 * 
 * @param params - Upload parameters
 * @returns Object with the storage path (not public URL)
 * @throws Error if upload fails
 */
export async function uploadToBucket(params: UploadParams): Promise<{ path: string }> {
  const { bucket, projectId, file, filename } = params;
  
  const path = buildPath(projectId, filename || file.name);
  
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  
  return { path };
}

/**
 * Upload CFDI XML file following CFDI-specific conventions
 * Format: emisor_rfc/YYMM-uuid-filename.xml
 * 
 * @param emisorRfc - RFC del emisor
 * @param file - File to upload
 * @param filename - Optional custom filename
 * @returns Object with the storage path (relative, not URL)
 * @throws Error if upload fails
 */
export async function uploadCfdiXml(
  emisorRfc: string,
  file: File,
  filename?: string
): Promise<{ path: string }> {
  const yymm = toYYMM(new Date());
  const uuid = crypto.randomUUID();
  const finalFilename = filename || file.name;
  
  const path = buildCfdiPath({
    scope: emisorRfc,
    yymm,
    uuid,
    filename: finalFilename
  });
  
  const { error } = await supabase.storage
    .from('cfdi')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('CFDI upload error:', error);
    throw new Error(`Failed to upload CFDI: ${error.message}`);
  }
  
  return { path };
}

/**
 * Generate a signed URL for accessing a file in a private bucket
 * 
 * @param params - Signed URL parameters
 * @returns Object with the signed URL
 * @throws Error if URL generation fails
 */
export async function getSignedUrl(params: SignedUrlParams): Promise<{ url: string }> {
  const { bucket, path, expiresInSeconds = 600 } = params; // Default 10 minutes
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  
  if (error || !data?.signedUrl) {
    console.error('Signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
  }
  
  return { url: data.signedUrl };
}

/**
 * Get a signed URL specifically for CFDI XML files
 * Convenience wrapper with default 600s expiration
 * 
 * @param xmlPath - Relative path to the XML file in cfdi bucket
 * @param expiresInSeconds - Optional expiration time (default 600s)
 * @returns Object with the signed URL
 */
export async function getCfdiSignedUrl(
  xmlPath: string,
  expiresInSeconds: number = 600
): Promise<{ url: string }> {
  return getSignedUrl({
    bucket: 'cfdi',
    path: xmlPath,
    expiresInSeconds
  });
}

/**
 * Delete a file from a Supabase Storage bucket
 * 
 * @param bucket - Bucket name
 * @param path - File path
 * @returns True if deletion succeeded
 */
export async function deleteFromBucket(bucket: BucketName, path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    console.error('Delete error:', error);
    return false;
  }
  
  return true;
}

/**
 * Get public URL for a file (only use with public buckets)
 * This is kept for backwards compatibility but should NOT be used with private buckets
 * 
 * @param bucket - Bucket name
 * @param path - File path
 * @returns Public URL
 */
export function getPublicUrl(bucket: BucketName, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
