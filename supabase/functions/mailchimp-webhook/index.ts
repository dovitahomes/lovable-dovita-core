import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MailchimpWebhookEvent {
  type: string;
  fired_at: string;
  data: {
    id?: string;
    email?: string;
    list_id?: string;
    merges?: Record<string, any>;
    [key: string]: any;
  };
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

    // Mailchimp sends webhook events as query params for validation
    // and POST body for actual events
    if (req.method === 'GET') {
      // Webhook verification - Mailchimp sends a GET request to verify the endpoint
      console.log('Webhook verification request received');
      return new Response('OK', { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    // Parse webhook event from POST body
    const contentType = req.headers.get('content-type') || '';
    
    let event: MailchimpWebhookEvent;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Mailchimp typically sends form data
      const formData = await req.formData();
      const type = formData.get('type') as string;
      const firedAt = formData.get('fired_at') as string;
      const data = formData.get('data') as string;
      
      event = {
        type,
        fired_at: firedAt,
        data: data ? JSON.parse(data) : {},
      };
    } else {
      // Fallback to JSON
      event = await req.json();
    }

    console.log('Mailchimp webhook event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'subscribe':
        console.log('New subscriber:', event.data.email);
        // Aquí podrías crear un lead automáticamente si el email no existe
        break;

      case 'unsubscribe':
        console.log('Unsubscribed:', event.data.email);
        break;

      case 'campaign':
        console.log('Campaign event:', event.data.id);
        // Aquí podrías sincronizar métricas de campaña
        break;

      case 'cleaned':
        console.log('Email cleaned:', event.data.email);
        break;

      // Evento personalizado para emails recibidos (requiere configuración en Mailchimp)
      case 'inbound':
        if (event.data.email) {
          const { error: insertError } = await supabase
            .from('mailchimp_emails')
            .insert({
              message_id: event.data.id || `msg_${Date.now()}`,
              conversation_id: event.data.conversation_id,
              from_email: event.data.email,
              from_name: event.data.merges?.FNAME || event.data.email,
              to_email: event.data.to_email || '',
              subject: event.data.subject || 'Sin asunto',
              body_text: event.data.text,
              body_html: event.data.html,
              received_at: event.fired_at || new Date().toISOString(),
              metadata: {
                raw_event: event.data,
              },
            });

          if (insertError) {
            console.error('Error inserting email:', insertError);
            throw insertError;
          }

          console.log('Inbound email saved successfully');
        }
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ success: true, eventType: event.type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in mailchimp-webhook function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
