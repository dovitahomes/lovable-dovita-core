import { supabase } from '@/integrations/supabase/client';

/**
 * Convierte avatar_url (ruta relativa en bucket avatars) a URL pública lista para usar en <img src>.
 *
 * - Si ya viene como URL absoluta (http/https), la regresa tal cual.
 * - Si viene null/undefined/"", regresa undefined.
 */
export function getAvatarPublicUrl(
  avatarPath: string | null | undefined
): string | undefined {
  if (!avatarPath) return undefined;

  const trimmed = avatarPath.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return supabase.storage.from('avatars').getPublicUrl(trimmed).data.publicUrl;
}
