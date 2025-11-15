import { useState } from "react";
import { useEmailConfig } from "@/hooks/useEmailConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Server, Key } from "lucide-react";

export default function EmailConfiguration() {
  const { config, isLoading, updateConfig, isUpdating } = useEmailConfig();
  
  const [formData, setFormData] = useState({
    proveedor: config?.proveedor || 'none',
    mailchimp_api_key: config?.mailchimp_api_key || '',
    mailchimp_server_prefix: config?.mailchimp_server_prefix || '',
    mailchimp_default_list_id: config?.mailchimp_default_list_id || '',
    mailchimp_total_seats: config?.mailchimp_total_seats || 0,
    mailchimp_generic_email: config?.mailchimp_generic_email || '',
    resend_api_key: config?.resend_api_key || '',
    resend_from_domain: config?.resend_from_domain || '',
  });

  // Actualizar form cuando config carga
  useState(() => {
    if (config) {
      setFormData({
        proveedor: config.proveedor,
        mailchimp_api_key: config.mailchimp_api_key || '',
        mailchimp_server_prefix: config.mailchimp_server_prefix || '',
        mailchimp_default_list_id: config.mailchimp_default_list_id || '',
        mailchimp_total_seats: config.mailchimp_total_seats || 0,
        mailchimp_generic_email: config.mailchimp_generic_email || '',
        resend_api_key: config.resend_api_key || '',
        resend_from_domain: config.resend_from_domain || '',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Email</h1>
        <p className="text-muted-foreground mt-2">
          Configure el proveedor de email para envío de mensajes desde la plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Proveedor */}
        <Card>
          <CardHeader>
            <CardTitle>Proveedor de Email</CardTitle>
            <CardDescription>
              Seleccione el servicio que desea utilizar para envío de emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.proveedor}
              onValueChange={(value) => setFormData({ ...formData, proveedor: value as any })}
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="mailchimp" id="mailchimp" />
                <Label htmlFor="mailchimp" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Mailchimp</div>
                  <div className="text-sm text-muted-foreground">
                    Marketing automation, templates y métricas avanzadas
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="resend" id="resend" />
                <Label htmlFor="resend" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Resend</div>
                  <div className="text-sm text-muted-foreground">
                    Emails transaccionales simples y rápidos
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Ninguno</div>
                  <div className="text-sm text-muted-foreground">
                    No enviar emails desde la plataforma
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Configuración Mailchimp */}
        {formData.proveedor === 'mailchimp' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configuración Mailchimp
              </CardTitle>
              <CardDescription>
                Configure las credenciales y ajustes de su cuenta Mailchimp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mailchimp_api_key">
                  API Key <Key className="inline h-3 w-3 ml-1" />
                </Label>
                <Input
                  id="mailchimp_api_key"
                  type="password"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-usX"
                  value={formData.mailchimp_api_key}
                  onChange={(e) => setFormData({ ...formData, mailchimp_api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenga su API key en Account → Extras → API keys
                </p>
              </div>

              <div>
                <Label htmlFor="mailchimp_server_prefix">Server Prefix</Label>
                <Input
                  id="mailchimp_server_prefix"
                  placeholder="us21"
                  value={formData.mailchimp_server_prefix}
                  onChange={(e) => setFormData({ ...formData, mailchimp_server_prefix: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ejemplo: us21 (última parte de su API key después del guión)
                </p>
              </div>

              <div>
                <Label htmlFor="mailchimp_default_list_id">Audience ID (List ID)</Label>
                <Input
                  id="mailchimp_default_list_id"
                  placeholder="xxxxxxxxxx"
                  value={formData.mailchimp_default_list_id}
                  onChange={(e) => setFormData({ ...formData, mailchimp_default_list_id: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ID de su lista principal en Audience → Settings → Audience name and defaults
                </p>
              </div>

              <Separator />

              <div>
                <Label htmlFor="mailchimp_generic_email">
                  Email Genérico <Mail className="inline h-3 w-3 ml-1" />
                </Label>
                <Input
                  id="mailchimp_generic_email"
                  type="email"
                  placeholder="info@dovitahomes.com"
                  value={formData.mailchimp_generic_email}
                  onChange={(e) => setFormData({ ...formData, mailchimp_generic_email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email de respaldo cuando un usuario no tiene asiento asignado
                </p>
              </div>

              <div>
                <Label htmlFor="mailchimp_total_seats">Total de Asientos</Label>
                <Input
                  id="mailchimp_total_seats"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.mailchimp_total_seats}
                  onChange={(e) => setFormData({ ...formData, mailchimp_total_seats: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número máximo de asientos disponibles en su plan Mailchimp
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuración Resend */}
        {formData.proveedor === 'resend' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configuración Resend
              </CardTitle>
              <CardDescription>
                Configure las credenciales de su cuenta Resend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resend_api_key">
                  API Key <Key className="inline h-3 w-3 ml-1" />
                </Label>
                <Input
                  id="resend_api_key"
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                  value={formData.resend_api_key}
                  onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obtenga su API key en resend.com/api-keys
                </p>
              </div>

              <div>
                <Label htmlFor="resend_from_domain">Dominio Verificado</Label>
                <Input
                  id="resend_from_domain"
                  placeholder="dovitahomes.com"
                  value={formData.resend_from_domain}
                  onChange={(e) => setFormData({ ...formData, resend_from_domain: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dominio verificado en resend.com/domains
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón Guardar */}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
