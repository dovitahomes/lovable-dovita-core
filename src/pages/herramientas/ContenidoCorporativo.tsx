import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";

interface ContenidoCorporativo {
  id: string;
  nombre_empresa: string;
  logo_url: string | null;
  isotipo_url: string | null;
  color_primario: string;
  color_secundario: string;
  direccion: string | null;
  telefono_principal: string | null;
  telefono_secundario: string | null;
  email_principal: string | null;
  email_secundario: string | null;
  sitio_web: string | null;
}

const ContenidoCorporativo = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ContenidoCorporativo>({
    id: "",
    nombre_empresa: "",
    logo_url: null,
    isotipo_url: null,
    color_primario: "#1e40af",
    color_secundario: "#059669",
    direccion: null,
    telefono_principal: null,
    telefono_secundario: null,
    email_principal: null,
    email_secundario: null,
    sitio_web: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: result, error } = await supabase
      .from("contenido_corporativo")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      toast.error("Error al cargar datos");
      return;
    }

    if (result) {
      setData(result);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = data.id
        ? await supabase
            .from("contenido_corporativo")
            .update({
              nombre_empresa: data.nombre_empresa,
              logo_url: data.logo_url,
              isotipo_url: data.isotipo_url,
              color_primario: data.color_primario,
              color_secundario: data.color_secundario,
              direccion: data.direccion,
              telefono_principal: data.telefono_principal,
              telefono_secundario: data.telefono_secundario,
              email_principal: data.email_principal,
              email_secundario: data.email_secundario,
              sitio_web: data.sitio_web,
            })
            .eq("id", data.id)
        : await supabase.from("contenido_corporativo").insert([
            {
              nombre_empresa: data.nombre_empresa,
              logo_url: data.logo_url,
              isotipo_url: data.isotipo_url,
              color_primario: data.color_primario,
              color_secundario: data.color_secundario,
              direccion: data.direccion,
              telefono_principal: data.telefono_principal,
              telefono_secundario: data.telefono_secundario,
              email_principal: data.email_principal,
              email_secundario: data.email_secundario,
              sitio_web: data.sitio_web,
            },
          ]);

      if (error) throw error;

      toast.success("Contenido corporativo guardado");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Contenido Corporativo</h1>
          <p className="text-muted-foreground">Gestiona la información de tu empresa</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Datos que aparecerán en documentos y membretes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">Nombre de la Empresa *</Label>
                <Input
                  id="nombre_empresa"
                  value={data.nombre_empresa}
                  onChange={(e) => setData({ ...data, nombre_empresa: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sitio_web">Sitio Web</Label>
                <Input
                  id="sitio_web"
                  type="url"
                  placeholder="https://..."
                  value={data.sitio_web || ""}
                  onChange={(e) => setData({ ...data, sitio_web: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL Logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  placeholder="https://..."
                  value={data.logo_url || ""}
                  onChange={(e) => setData({ ...data, logo_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isotipo_url">URL Isotipo</Label>
                <Input
                  id="isotipo_url"
                  type="url"
                  placeholder="https://..."
                  value={data.isotipo_url || ""}
                  onChange={(e) => setData({ ...data, isotipo_url: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color_primario">Color Primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_primario"
                    type="color"
                    value={data.color_primario}
                    onChange={(e) => setData({ ...data, color_primario: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={data.color_primario}
                    onChange={(e) => setData({ ...data, color_primario: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color_secundario">Color Secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_secundario"
                    type="color"
                    value={data.color_secundario}
                    onChange={(e) => setData({ ...data, color_secundario: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={data.color_secundario}
                    onChange={(e) => setData({ ...data, color_secundario: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={data.direccion || ""}
                onChange={(e) => setData({ ...data, direccion: e.target.value })}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono_principal">Teléfono Principal</Label>
                <Input
                  id="telefono_principal"
                  type="tel"
                  value={data.telefono_principal || ""}
                  onChange={(e) => setData({ ...data, telefono_principal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono_secundario">Teléfono Secundario</Label>
                <Input
                  id="telefono_secundario"
                  type="tel"
                  value={data.telefono_secundario || ""}
                  onChange={(e) => setData({ ...data, telefono_secundario: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_principal">Email Principal</Label>
                <Input
                  id="email_principal"
                  type="email"
                  value={data.email_principal || ""}
                  onChange={(e) => setData({ ...data, email_principal: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_secundario">Email Secundario</Label>
                <Input
                  id="email_secundario"
                  type="email"
                  value={data.email_secundario || ""}
                  onChange={(e) => setData({ ...data, email_secundario: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default ContenidoCorporativo;
