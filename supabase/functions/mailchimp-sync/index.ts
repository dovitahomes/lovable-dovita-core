import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncMetricsRequest {
  campaignId?: string; // Si se proporciona, sincroniza solo esa campaña; si no, sincroniza todas las no sincronizadas recientes
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: SyncMetricsRequest = await req.json().catch(() => ({}));
    const { campaignId } = body;

    console.log('Syncing Mailchimp metrics', { campaignId });

    // Obtener configuración de Mailchimp
    const { data: emailConfig, error: configError } = await supabase
      .from('email_config')
      .select('mailchimp_api_key, mailchimp_server_prefix')
      .single();

    if (configError || !emailConfig?.mailchimp_api_key || !emailConfig?.mailchimp_server_prefix) {
      throw new Error('Mailchimp no está configurado correctamente');
    }

    const { mailchimp_api_key, mailchimp_server_prefix } = emailConfig;

    // Obtener campañas a sincronizar
    let query = supabase
      .from('mailchimp_campaigns')
      .select('*');

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    } else {
      // Sincronizar campañas de los últimos 30 días que no se han sincronizado en las últimas 24 horas
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      query = query
        .gte('sent_at', thirtyDaysAgo)
        .or(`last_synced_at.is.null,last_synced_at.lt.${yesterday}`);
    }

    const { data: campaigns, error: campaignsError } = await query;

    if (campaignsError) {
      throw campaignsError;
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No campaigns to sync');
      return new Response(
        JSON.stringify({ success: true, syncedCount: 0, message: 'No campaigns to sync' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing ${campaigns.length} campaigns`);

    // Sincronizar métricas para cada campaña
    const syncResults = await Promise.allSettled(
      campaigns.map(async (campaign) => {
        try {
          // Obtener reporte de la campaña desde Mailchimp
          const reportUrl = `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/reports/${campaign.campaign_id}`;
          
          const reportResponse = await fetch(reportUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${mailchimp_api_key}`,
              'Content-Type': 'application/json',
            },
          });

          if (!reportResponse.ok) {
            const errorText = await reportResponse.text();
            console.error(`Error fetching Mailchimp report for ${campaign.campaign_id}:`, errorText);
            throw new Error(`Mailchimp API error: ${reportResponse.status}`);
          }

          const reportData = await reportResponse.json();

          // Actualizar métricas en la base de datos
          const { error: updateError } = await supabase
            .from('mailchimp_campaigns')
            .update({
              opens: reportData.opens?.unique_opens || 0,
              clicks: reportData.clicks?.unique_clicks || 0,
              bounces: reportData.bounces?.hard_bounces || 0,
              last_synced_at: new Date().toISOString(),
              metadata: {
                ...campaign.metadata,
                last_report: {
                  emails_sent: reportData.emails_sent,
                  abuse_reports: reportData.abuse_reports,
                  unsubscribed: reportData.unsubscribed,
                  synced_at: new Date().toISOString(),
                },
              },
            })
            .eq('id', campaign.id);

          if (updateError) {
            throw updateError;
          }

          console.log(`Synced metrics for campaign ${campaign.campaign_id}`);
          return { campaignId: campaign.campaign_id, success: true };
        } catch (error: any) {
          console.error(`Error syncing campaign ${campaign.campaign_id}:`, error);
          return { campaignId: campaign.campaign_id, success: false, error: error?.message || 'Unknown error' };
        }
      })
    );

    const successCount = syncResults.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = syncResults.length - successCount;

    console.log(`Sync completed: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        syncedCount: successCount,
        failedCount: failCount,
        results: syncResults.map(r => r.status === 'fulfilled' ? r.value : { success: false }),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in mailchimp-sync function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
