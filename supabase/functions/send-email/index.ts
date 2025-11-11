import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  leadName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, cc, subject, body, leadName }: SendEmailRequest = await req.json();

    console.log('[send-email] Processing email:', { to, subject, hasCC: !!cc });

    // Validar campos requeridos
    if (!to || !subject || !body) {
      throw new Error("Faltan campos requeridos: to, subject, body");
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error("Email 'to' inválido");
    }

    if (cc && !emailRegex.test(cc)) {
      throw new Error("Email 'cc' inválido");
    }

    // Construir HTML email con formato profesional
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .email-container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .email-header {
              border-bottom: 3px solid #0038A8;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .email-body {
              white-space: pre-wrap;
              margin-bottom: 30px;
            }
            .email-footer {
              border-top: 1px solid #eee;
              padding-top: 20px;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .logo {
              color: #0038A8;
              font-size: 24px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <div class="logo">Dovita</div>
            </div>
            <div class="email-body">
              ${body.replace(/\n/g, '<br>')}
            </div>
            <div class="email-footer">
              <p>Este email fue enviado desde Dovita CRM</p>
              <p>© ${new Date().getFullYear()} Dovita. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email usando Resend
    const emailResponse = await resend.emails.send({
      from: "Dovita CRM <onboarding@resend.dev>", // En producción cambiar a dominio verificado
      to: [to],
      cc: cc ? [cc] : undefined,
      subject,
      html: htmlBody,
      text: body, // Fallback texto plano
    });

    console.log('[send-email] Email sent successfully:', emailResponse);

    if (emailResponse.error) {
      throw new Error(emailResponse.error.message);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: emailResponse.data?.id,
        message: "Email enviado exitosamente"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("[send-email] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Error desconocido al enviar email"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
