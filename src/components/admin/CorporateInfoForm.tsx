import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCorporateContent } from "@/hooks/useCorporateContent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadToBucket } from "@/lib/storage-helpers";

export default function CorporateInfoForm() {
  const { data: corporateData, isLoading } = useCorporateContent();
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    logo_url: "",
    isotipo_url: "",
    color_primario: "#000000",
    color_secundario: "#ffffff",
    email_principal: "",
    email_secundario: "",
    telefono_principal: "",
    telefono_secundario: "",
    direccion: "",
    sitio_web: "",
  });

  useEffect(() => {
    if (corporateData) {
      setFormData({
        nombre_empresa: corporateData.nombre_empresa || "",
        logo_url: corporateData.logo_url || "",
        isotipo_url: corporateData.isotipo_url || "",
        color_primario: corporateData.color_primario || "#000000",
        color_secundario: corporateData.color_secundario || "#ffffff",
        email_principal: corporateData.email_principal || "",
        email_secundario: corporateData.email_secundario || "",
        telefono_principal: corporateData.telefono_principal || "",
        telefono_secundario: corporateData.telefono_secundario || "",
        direccion: corporateData.direccion || "",
        sitio_web: corporateData.sitio_web || "",
      });
    }
  }, [corporateData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'isotipo_url') => {
    if (!e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    setUploading(field);

    try {
      const { path } = await uploadToBucket({
        file,
        bucket: 'documentos',
        filename: `corporate/${field}-${Date.now()}.${file.name.split('.').pop()}`,
      });

      setFormData({ ...formData, [field]: path });
      toast({ description: "Imagen cargada exitosamente" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        description: "Error al cargar imagen",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: existing } = await supabase
        .from('contenido_corporativo')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('contenido_corporativo')
          .update(formData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contenido_corporativo')
          .insert([formData]);

        if (error) throw error;
      }

      toast({ description: "Información corporativa guardada exitosamente" });
    } catch (error) {
      console.error('Error saving corporate info:', error);
      toast({
        variant: "destructive",
        description: "Error al guardar información corporativa",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Información de la Empresa
        </CardTitle>
        <CardDescription>
          Configura los datos corporativos que se mostrarán en toda la plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nombre_empresa">Nombre de la Empresa *</Label>
            <Input
              id="nombre_empresa"
              value={formData.nombre_empresa}
              onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
              placeholder="Dovita Construction"
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo Principal</Label>
              <div className="space-y-2">
                <Input
                  id="logo_url"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo_url')}
                  disabled={uploading === 'logo_url'}
                />
                {uploading === 'logo_url' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </div>
                )}
                {formData.logo_url && !uploading && (
                  <p className="text-sm text-muted-foreground">✓ Logo cargado</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isotipo_url">Isotipo / Ícono</Label>
              <div className="space-y-2">
                <Input
                  id="isotipo_url"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'isotipo_url')}
                  disabled={uploading === 'isotipo_url'}
                />
                {uploading === 'isotipo_url' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subiendo...
                  </div>
                )}
                {formData.isotipo_url && !uploading && (
                  <p className="text-sm text-muted-foreground">✓ Isotipo cargado</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="color_primario">Color Primario</Label>
              <div className="flex gap-2">
                <Input
                  id="color_primario"
                  type="color"
                  value={formData.color_primario}
                  onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color_primario}
                  onChange={(e) => setFormData({ ...formData, color_primario: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color_secundario">Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="color_secundario"
                  type="color"
                  value={formData.color_secundario}
                  onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color_secundario}
                  onChange={(e) => setFormData({ ...formData, color_secundario: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email_principal">Email Principal</Label>
              <Input
                id="email_principal"
                type="email"
                value={formData.email_principal}
                onChange={(e) => setFormData({ ...formData, email_principal: e.target.value })}
                placeholder="contacto@dovita.mx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_secundario">Email Secundario</Label>
              <Input
                id="email_secundario"
                type="email"
                value={formData.email_secundario}
                onChange={(e) => setFormData({ ...formData, email_secundario: e.target.value })}
                placeholder="ventas@dovita.mx"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefono_principal">Teléfono Principal</Label>
              <Input
                id="telefono_principal"
                type="tel"
                value={formData.telefono_principal}
                onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })}
                placeholder="+52 55 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono_secundario">Teléfono Secundario</Label>
              <Input
                id="telefono_secundario"
                type="tel"
                value={formData.telefono_secundario}
                onChange={(e) => setFormData({ ...formData, telefono_secundario: e.target.value })}
                placeholder="+52 55 8765 4321"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección Física</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Av. Principal #123, Col. Centro, CDMX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sitio_web">Sitio Web</Label>
            <Input
              id="sitio_web"
              type="url"
              value={formData.sitio_web}
              onChange={(e) => setFormData({ ...formData, sitio_web: e.target.value })}
              placeholder="https://www.dovita.mx"
            />
          </div>

          <Button type="submit" disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Información Corporativa"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
