import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmailConfig } from "@/hooks/useEmailConfig";
import { useMailchimpSeat } from "@/hooks/useMailchimpSeat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Paperclip, X, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface EmailComposerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  leadEmail: string;
}

interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    name: "Seguimiento Inicial",
    subject: "Gracias por tu interés - Dovita",
    body: `Hola,

Muchas gracias por contactarnos. Nos encantaría ayudarte con tu proyecto de construcción.

¿Cuándo te vendría bien agendar una llamada para discutir tus necesidades?

Saludos cordiales,
Equipo Dovita`
  },
  {
    name: "Propuesta Enviada",
    subject: "Propuesta de Proyecto - Dovita",
    body: `Hola,

Te envío la propuesta detallada para tu proyecto. Incluye presupuesto, cronograma y alcance del trabajo.

¿Tienes alguna pregunta o necesitas aclaraciones?

Quedo al pendiente,
Equipo Dovita`
  },
  {
    name: "Recordatorio",
    subject: "Seguimiento de tu proyecto",
    body: `Hola,

Solo quería dar seguimiento a nuestra última conversación sobre tu proyecto.

¿Hay algo en lo que pueda ayudarte para avanzar?

Saludos,
Equipo Dovita`
  }
];

export function EmailComposerDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadEmail,
}: EmailComposerDialogProps) {
  const [to, setTo] = useState(leadEmail);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const queryClient = useQueryClient();
  
  // Obtener usuario actual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });
  }, []);
  
  // Obtener configuración de email y asiento Mailchimp
  const { config, isLoading: configLoading } = useEmailConfig();
  const { data: mailchimpSeat } = useMailchimpSeat(userId);

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!to.trim() || !subject.trim() || !body.trim()) {
        throw new Error("Por favor completa todos los campos requeridos");
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new Error("Email inválido");
      }

      // Obtener usuario actual para asignación de asiento
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // 1. Enviar email via email-router (priorización inteligente)
      const { data, error: functionError } = await supabase.functions.invoke('email-router', {
        body: { 
          to,
          cc: cc.trim() || undefined,
          subject,
          body,
          leadName,
          userId, // Para asignación de asiento Mailchimp
        }
      });

      if (functionError) throw functionError;
      if (!data?.success) throw new Error(data?.error || 'Error al enviar email');

      // 2. Registrar actividad en CRM
      const { error: activityError } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: 'email_sent',
          entity_type: 'lead',
          entity_id: leadId,
          description: `Email enviado: "${subject}"`,
          metadata_json: {
            to,
            cc: cc.trim() || null,
            subject,
            preview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
            provider: data.provider,
            sentFrom: data.sentFrom,
          },
          performed_by: userId,
        });

      if (activityError) throw activityError;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success(`Email enviado desde ${data.sentFrom} vía ${data.provider.toUpperCase()}`);
      
      // Reset form
      setTo(leadEmail);
      setCc("");
      setSubject("");
      setBody("");
      setShowCc(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error sending email:', error);
      toast.error("Error al enviar email: " + error.message);
    }
  });

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
  };

  const handleSend = () => {
    sendEmailMutation.mutate();
  };

  const handleCancel = () => {
    setTo(leadEmail);
    setCc("");
    setSubject("");
    setBody("");
    setShowCc(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Enviar Email a {leadName}
          </DialogTitle>
          <DialogDescription>
            Redacta y envía un email directamente al lead. Se registrará automáticamente en el timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerta si no hay proveedor configurado */}
          {config && config.proveedor === 'none' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay proveedor de email configurado. Por favor, configure Mailchimp o Resend en{' '}
                <a href="/herramientas/configuracion-email" className="underline font-medium">
                  Configuración de Email
                </a>.
              </AlertDescription>
            </Alert>
          )}

          {/* Badge indicador de proveedor */}
          {config && config.proveedor !== 'none' && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Enviando vía{' '}
                <Badge variant="outline" className="ml-1">
                  {config.proveedor === 'mailchimp' ? 'Mailchimp' : 'Resend'}
                </Badge>
                {mailchimpSeat && (
                  <Badge variant="secondary" className="ml-1">
                    desde {mailchimpSeat.mailchimp_email}
                  </Badge>
                )}
              </span>
            </div>
          )}

          {/* Plantillas rápidas */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Plantillas rápidas</Label>
            <div className="flex gap-2 flex-wrap">
              {EMAIL_TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  size="sm"
                  variant="outline"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Para */}
          <div className="space-y-2">
            <Label htmlFor="to">
              Para <span className="text-destructive">*</span>
            </Label>
            <Input
              id="to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="destinatario@ejemplo.com"
              className="font-mono text-sm"
            />
          </div>

          {/* CC (opcional) */}
          {!showCc ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowCc(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + Agregar CC
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cc">CC</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCc(false);
                    setCc("");
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                id="cc"
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="copia@ejemplo.com"
                className="font-mono text-sm"
              />
            </div>
          )}

          {/* Asunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Asunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Escribe el asunto del email"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {subject.length}/200
            </p>
          </div>

          {/* Cuerpo */}
          <div className="space-y-2">
            <Label htmlFor="body">
              Mensaje <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="min-h-[250px] resize-y font-sans"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {body.length}/5000
            </p>
          </div>

          {/* Info de attachments (placeholder) */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
            <Paperclip className="h-4 w-4" />
            <span>Los archivos adjuntos se agregarán en una versión futura</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={sendEmailMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={
              sendEmailMutation.isPending || 
              configLoading || 
              !to.trim() || 
              !subject.trim() || 
              !body.trim() || 
              (config?.proveedor === 'none')
            }
          >
            {sendEmailMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
