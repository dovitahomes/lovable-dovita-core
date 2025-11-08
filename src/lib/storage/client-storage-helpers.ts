/**
 * Storage Helpers específicos para Client App
 * Manejo de documentos y fotos de proyectos con URLs firmadas
 */

import { supabase } from '@/integrations/supabase/client';
import { uploadToBucket, getSignedUrl, deleteFromBucket } from './storage-helpers';
import type { BucketName } from './buckets';

/**
 * Subir archivo a bucket project_docs
 */
export async function uploadProjectFile(
  projectId: string,
  file: File,
  filename?: string
): Promise<{ path: string }> {
  return uploadToBucket({
    bucket: 'project_docs',
    projectId,
    file,
    filename
  });
}

/**
 * Subir foto a bucket project_photos
 */
export async function uploadProjectPhoto(
  projectId: string,
  file: File,
  filename?: string
): Promise<{ path: string }> {
  return uploadToBucket({
    bucket: 'project_photos',
    projectId,
    file,
    filename
  });
}

/**
 * Listar archivos de un proyecto en un bucket
 */
export async function listProjectFiles(
  bucket: BucketName,
  projectId: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(projectId, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) throw error;
  return data || [];
}

/**
 * Obtener URL firmada para archivo de proyecto
 */
export async function getProjectFileUrl(
  bucket: BucketName,
  path: string,
  expiresInSeconds: number = 600
): Promise<{ url: string }> {
  return getSignedUrl({
    bucket,
    path,
    expiresInSeconds
  });
}

/**
 * Eliminar archivo de proyecto
 */
export async function deleteProjectFile(
  bucket: BucketName,
  path: string
): Promise<boolean> {
  return deleteFromBucket(bucket, path);
}
