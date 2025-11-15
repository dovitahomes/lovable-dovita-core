import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TemplatesRequest {
  action: 'list' | 'get';
  templateId?: string;
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
    const body: TemplatesRequest = await req.json();
    const { action, templateId } = body;

    console.log('Mailchimp templates request', { action, templateId });

    // Obtener configuración de Mailchimp
    const { data: emailConfig, error: configError } = await supabase
      .from('email_config')
      .select('mailchimp_api_key, mailchimp_server_prefix')
      .single();

    if (configError || !emailConfig?.mailchimp_api_key || !emailConfig?.mailchimp_server_prefix) {
      throw new Error('Mailchimp no está configurado correctamente');
    }

    const { mailchimp_api_key, mailchimp_server_prefix } = emailConfig;

    if (action === 'list') {
      // Obtener lista de templates
      const templatesUrl = `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/templates`;
      
      const templatesResponse = await fetch(templatesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mailchimp_api_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!templatesResponse.ok) {
        const errorText = await templatesResponse.text();
        console.error('Error fetching Mailchimp templates:', errorText);
        throw new Error(`Mailchimp API error: ${templatesResponse.status}`);
      }

      const templatesData = await templatesResponse.json();

      console.log(`Found ${templatesData.templates?.length || 0} templates`);

      return new Response(
        JSON.stringify({
          success: true,
          templates: templatesData.templates || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'get' && templateId) {
      // Obtener contenido de un template específico
      const templateUrl = `https://${mailchimp_server_prefix}.api.mailchimp.com/3.0/templates/${templateId}/default-content`;
      
      const templateResponse = await fetch(templateUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${mailchimp_api_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!templateResponse.ok) {
        const errorText = await templateResponse.text();
        console.error('Error fetching Mailchimp template content:', errorText);
        throw new Error(`Mailchimp API error: ${templateResponse.status}`);
      }

      const templateData = await templateResponse.json();

      console.log(`Fetched template content for ${templateId}`);

      return new Response(
        JSON.stringify({
          success: true,
          content: templateData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid action or missing templateId');
    }
  } catch (error: any) {
    console.error('Error in mailchimp-templates function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
