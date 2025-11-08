/**
 * Storage Helper Functions for Supabase Storage
 * Unified approach for file uploads, signed URLs, and path management
 */

import { supabase } from '@/integrations/supabase/client';
import type { BucketName } from './buckets';

interface UploadParams {
  bucket: BucketName;
  projectId?: string;
  file: File;
  filename?: string;
}

interface SignedUrlParams {
  bucket: BucketName;
  path: string;
  expiresInSeconds?: number;
}

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
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
  
  const path = buildPath({ projectId, filename: filename || file.name });
  
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
 * Format: emisor_rfc/YYYY-MM-uuid-filename.xml
 */
export async function uploadCfdiXml(
  emisorRfc: string,
  file: File,
  filename?: string
): Promise<{ path: string }> {
  const yyyyMm = toYYYYMM(new Date());
  const uuid = crypto.randomUUID();
  const finalFilename = filename || file.name;
  
  const slugified = finalFilename
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  const path = buildCfdiPath({ emisorRfc, yyyyMm, uuid, filename: slugified });
  
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
 * Get signed URL for private bucket files
 */
export async function getSignedUrl(params: SignedUrlParams): Promise<{ url: string }> {
  const { bucket, path, expiresInSeconds = 600 } = params;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);
  
  if (error) {
    console.error('Signed URL error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
  
  if (!data?.signedUrl) {
    throw new Error('No signed URL returned');
  }
  
  return { url: data.signedUrl };
}

/**
 * Get signed URL for CFDI files
 */
export async function getCfdiSignedUrl(
  path: string,
  expiresInSeconds: number = 600
): Promise<{ url: string }> {
  return getSignedUrl({
    bucket: 'cfdi',
    path,
    expiresInSeconds
  });
}

/**
 * Delete file from bucket
 */
export async function deleteFromBucket(
  bucket: BucketName,
  path: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
  
  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
  
  return true;
}

/**
 * Extract metadata from File object
 */
export function extractFileMetadata(file: File): FileMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  };
}

/**
 * Build storage path: {project_id}/{YYMM}-{uuid}-{filename}
 * Normalizes filename to safe format and adds timestamp+uuid prefix
 */
export function buildPath({
  projectId,
  filename,
}: {
  projectId?: string;
  filename: string;
}): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yymm = `${yy}${mm}`;
  
  const uuid = crypto.randomUUID();
  
  const lastDotIndex = filename.lastIndexOf('.');
  const ext = lastDotIndex > -1 ? filename.slice(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > -1 ? filename.slice(0, lastDotIndex) : filename;
  
  // Normalize filename: lowercase, remove accents, replace non-alphanumeric with underscore
  const slugified = nameWithoutExt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  const fullName = `${yymm}-${uuid}-${slugified}${ext}`;
  
  if (projectId) {
    return `${projectId}/${fullName}`;
  }
  
  return fullName;
}

/**
 * Build CFDI path: emisor_rfc/YYYY-MM-uuid-filename.xml
 */
export function buildCfdiPath({
  emisorRfc,
  yyyyMm,
  uuid,
  filename
}: {
  emisorRfc: string;
  yyyyMm: string;
  uuid: string;
  filename: string;
}): string {
  return `${emisorRfc}/${yyyyMm}-${uuid}-${filename}`;
}

/**
 * Format date to YYYY-MM
 */
export function toYYYYMM(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
