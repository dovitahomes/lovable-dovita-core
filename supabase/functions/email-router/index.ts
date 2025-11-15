import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRouterRequest {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  leadName?: string;
  userId?: string;
}

interface EmailRouterResponse {
  success: boolean;
  provider: 'mailchimp' | 'resend' | 'none';
  sentFrom: string;
  messageId?: string;
  error?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, cc, subject, body, leadName, userId }: EmailRouterRequest = await req.json();

    console.log('[email-router] Request:', { to, subject, userId });

    // Validaciones básicas
    if (!to || !subject || !body) {
      throw new Error("Faltan campos requeridos: to, subject, body");
    }

    // 1. Obtener configuración global
    const { data: config, error: configError } = await supabase
      .from('email_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error("No se pudo obtener la configuración de email");
    }

    console.log('[email-router] Config:', { proveedor: config.proveedor });

    // 2. Decidir proveedor y email de envío
    let provider: 'mailchimp' | 'resend' | 'none' = config.proveedor;
    let sentFrom = '';
    let mailchimpEmail: string | null = null;

    if (config.proveedor === 'none') {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No hay proveedor de email configurado. Configure Mailchimp o Resend en Configuración de Email.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // 3. Priorización: Mailchimp > Resend
    if (config.proveedor === 'mailchimp') {
      // Verificar si usuario tiene asiento personal
      if (userId) {
        const { data: userSeat } = await supabase
          .from('mailchimp_seats')
          .select('mailchimp_email')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('seat_type', 'user')
          .single();

        if (userSeat) {
          mailchimpEmail = userSeat.mailchimp_email;
          sentFrom = userSeat.mailchimp_email;
          console.log('[email-router] Using user Mailchimp seat:', sentFrom);
        }
      }

      // Si no tiene asiento personal, usar email genérico
      if (!mailchimpEmail) {
        const { data: genericSeat } = await supabase
          .from('mailchimp_seats')
          .select('mailchimp_email')
          .eq('seat_type', 'generic')
          .eq('is_active', true)
          .single();

        if (genericSeat) {
          mailchimpEmail = genericSeat.mailchimp_email;
          sentFrom = genericSeat.mailchimp_email;
          console.log('[email-router] Using generic Mailchimp seat:', sentFrom);
        } else {
          // No hay asientos Mailchimp, fallback a Resend
          console.log('[email-router] No Mailchimp seats available, falling back to Resend');
          provider = 'resend';
        }
      }
    }

    // 4. Enviar según proveedor
    if (provider === 'mailchimp' && mailchimpEmail) {
      // TODO FASE 2: Implementar envío via Mailchimp
      // Por ahora, fallback a Resend
      console.log('[email-router] Mailchimp sending not implemented yet, using Resend');
      provider = 'resend';
    }

    if (provider === 'resend') {
      // Enviar via Resend (usando función existente)
      const resendResponse = await supabase.functions.invoke('send-email', {
        body: { to, cc, subject, body, leadName },
      });

      if (resendResponse.error) {
        throw new Error(resendResponse.error.message);
      }

      const resendDomain = config.resend_from_domain || 'resend.dev';
      sentFrom = `Dovita CRM <onboarding@${resendDomain}>`;

      return new Response(
        JSON.stringify({
          success: true,
          provider: 'resend',
          sentFrom,
          messageId: resendResponse.data?.messageId,
        } as EmailRouterResponse),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // No debería llegar aquí
    throw new Error("No se pudo determinar proveedor de email");

  } catch (error: any) {
    console.error("[email-router] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido al enrutar email",
      } as EmailRouterResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
