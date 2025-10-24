import { supabase } from '@/integrations/supabase/client';

export async function handleMagicLinkExchange() {
  // Para enlaces tipo /auth/callback?code=...
  const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
  if (error) throw error;
  return data;
}
