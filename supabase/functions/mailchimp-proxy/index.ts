import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCampaignRequest {
  from: string; // Email Mailchimp registrado (personal o genérico)
  to: string;
  subject: string;
  html: string;
}

interface MailchimpResponse {
  success: boolean;
  campaignId?: string;
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

    const { from, to, subject, html }: SendCampaignRequest = await req.json();

    console.log('[mailchimp-proxy] Sending campaign:', { from, to, subject });

    // Validaciones básicas
    if (!from || !to || !subject || !html) {
      throw new Error("Faltan campos requeridos: from, to, subject, html");
    }

    // Obtener configuración de Mailchimp
    const { data: config, error: configError } = await supabase
      .from('email_config')
      .select('mailchimp_api_key, mailchimp_server_prefix, mailchimp_default_list_id')
      .single();

    if (configError || !config || !config.mailchimp_api_key) {
      throw new Error("Configuración de Mailchimp no encontrada o incompleta");
    }

    const { mailchimp_api_key, mailchimp_server_prefix, mailchimp_default_list_id } = config;

    // 1. Crear campaña en Mailchimp
    const createCampaignResponse = await fetch(
      `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/campaigns`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailchimp_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'regular',
          recipients: {
            list_id: mailchimp_default_list_id,
          },
          settings: {
            subject_line: subject,
            from_name: from.split('@')[0], // Extraer nombre del email
            reply_to: from,
            title: `Campaign - ${subject}`,
          },
        }),
      }
    );

    if (!createCampaignResponse.ok) {
      const error = await createCampaignResponse.text();
      console.error('[mailchimp-proxy] Error creating campaign:', error);
      throw new Error(`Error al crear campaña Mailchimp: ${error}`);
    }

    const campaign = await createCampaignResponse.json();
    const campaignId = campaign.id;

    console.log('[mailchimp-proxy] Campaign created:', campaignId);

    // 2. Agregar contenido HTML a la campaña
    const setContentResponse = await fetch(
      `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mailchimp_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: html,
        }),
      }
    );

    if (!setContentResponse.ok) {
      const error = await setContentResponse.text();
      console.error('[mailchimp-proxy] Error setting content:', error);
      throw new Error(`Error al configurar contenido: ${error}`);
    }

    console.log('[mailchimp-proxy] Content set for campaign:', campaignId);

    // 3. Agregar destinatario a la lista (si no existe)
    const addMemberResponse = await fetch(
      `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/lists/${mailchimp_default_list_id}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailchimp_api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: to,
          status: 'subscribed',
        }),
      }
    );

    // No validar error aquí porque puede que ya exista (status 400)
    if (addMemberResponse.ok) {
      console.log('[mailchimp-proxy] Member added:', to);
    } else {
      console.log('[mailchimp-proxy] Member might already exist:', to);
    }

    // 4. Enviar campaña
    const sendCampaignResponse = await fetch(
      `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mailchimp_api_key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!sendCampaignResponse.ok) {
      const error = await sendCampaignResponse.text();
      console.error('[mailchimp-proxy] Error sending campaign:', error);
      throw new Error(`Error al enviar campaña: ${error}`);
    }

    console.log('[mailchimp-proxy] Campaign sent successfully:', campaignId);

    // 5. Registrar en mailchimp_campaigns (tabla para métricas)
    const { error: insertError } = await supabase
      .from('mailchimp_campaigns')
      .insert({
        mailchimp_campaign_id: campaignId,
        subject: subject,
        sent_by: from,
        sent_from_email: from,
        recipients_count: 1, // Por ahora solo envío individual
        status: 'sent',
      });

    if (insertError) {
      console.error('[mailchimp-proxy] Error saving campaign to DB:', insertError);
      // No lanzar error, la campaña ya se envió
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaignId: campaignId,
      } as MailchimpResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[mailchimp-proxy] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error desconocido al enviar via Mailchimp",
      } as MailchimpResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
