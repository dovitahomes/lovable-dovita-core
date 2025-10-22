import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SignatureCanvas from "react-signature-canvas";
import { Trash2, Upload, Save } from "lucide-react";

interface WishlistFormProps {
  projectId: string;
  existingWishlist?: any;
  onSaved: () => void;
}

export function WishlistForm({ projectId, existingWishlist, onSaved }: WishlistFormProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firmaTab, setFirmaTab] = useState<"manuscrita" | "pdf">("manuscrita");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    // Información General
    nombre: "",
    telefono: "",
    email: "",
    etapa_compra: "",
    
    // Estilo y Diseño
    estilos: [] as string[],
    estilo_otro: "",
    
    // Espacios y Distribución
    recamaras: "",
    banos: "",
    niveles: "",
    espacios_adicionales: [] as string[],
    
    // Estilo de Vida
    mascotas: false,
    trabajo_casa: false,
    entretenimiento: false,
    
    // Presupuesto y Tiempos
    presupuesto_min: "",
    presupuesto_max: "",
    fecha_inicio: "",
    
    // Sustentabilidad
    paneles_solares: false,
    captacion_agua: false,
    materiales_reciclados: false,
    
    // Comentarios
    comentarios: ""
  });

  useEffect(() => {
    if (existingWishlist?.payload) {
      setFormData(existingWishlist.payload);
    }
  }, [existingWishlist]);

  const ESTILOS_ARQUITECTURA = [
    "Moderno", "Minimalista", "Contemporáneo", "Tradicional", "Rústico", 
    "Industrial", "Mediterráneo", "Colonial", "Otro"
  ];

  const ESPACIOS_ADICIONALES = [
    "Estudio/Home Office", "Gym", "Sala de Cine", "Bodega", "Terraza", 
    "Jardín", "Alberca", "Cochera Doble", "Cuarto de Servicio"
  ];

  const handleCheckbox = (field: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
  };

  const handleSave = async (firmar: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      let firmaUrl = existingWishlist?.firma_url;
      let firmaTipo = existingWishlist?.firma_tipo;

      if (firmar) {
        if (firmaTab === "manuscrita") {
          if (!signatureRef.current || signatureRef.current.isEmpty()) {
            toast.error("Por favor, dibuje su firma");
            return;
          }

          const signatureData = signatureRef.current.toDataURL();
          const blob = await (await fetch(signatureData)).blob();
          const fileName = `${user.id}/${projectId}-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from('firmas')
            .upload(fileName, blob);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('firmas')
            .getPublicUrl(fileName);

          firmaUrl = publicUrl;
          firmaTipo = "manuscrita";
        } else if (firmaTab === "pdf") {
          if (!pdfFile) {
            toast.error("Por favor, suba un PDF firmado");
            return;
          }

          const fileName = `${user.id}/${projectId}-${Date.now()}.pdf`;
          const { error: uploadError } = await supabase.storage
            .from('firmas')
            .upload(fileName, pdfFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('firmas')
            .getPublicUrl(fileName);

          firmaUrl = publicUrl;
          firmaTipo = "pdf";
        }
      }

      const wishlistData = {
        project_id: projectId,
        payload: formData,
        firma_tipo: firmar ? firmaTipo : existingWishlist?.firma_tipo,
        firma_url: firmar ? firmaUrl : existingWishlist?.firma_url,
        firmado: firmar,
        firmado_at: firmar ? new Date().toISOString() : existingWishlist?.firmado_at
      };

      if (existingWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .update(wishlistData)
          .eq('id', existingWishlist.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert(wishlistData);

        if (error) throw error;
      }

      toast.success(firmar ? "Wishlist firmado exitosamente" : "Wishlist guardado");
      onSaved();
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  const isFirmado = existingWishlist?.firmado;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Información General</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Nombre Completo</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={isFirmado}
            />
          </div>
          <div>
            <Label>Teléfono</Label>
            <Input
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={isFirmado}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isFirmado}
            />
          </div>
          <div>
            <Label>Etapa de Compra de Terreno</Label>
            <Select 
              value={formData.etapa_compra} 
              onValueChange={(value) => setFormData({ ...formData, etapa_compra: value })}
              disabled={isFirmado}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ya_comprado">Ya comprado</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="buscando">Buscando</SelectItem>
                <SelectItem value="sin_terreno">Sin terreno aún</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Estilo y Diseño Deseado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {ESTILOS_ARQUITECTURA.map((estilo) => (
              <div key={estilo} className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.estilos.includes(estilo)}
                  onCheckedChange={() => handleCheckbox('estilos', estilo)}
                  disabled={isFirmado}
                />
                <label className="text-sm">{estilo}</label>
              </div>
            ))}
          </div>
          {formData.estilos.includes("Otro") && (
            <div>
              <Label>Especificar otro estilo</Label>
              <Input
                value={formData.estilo_otro}
                onChange={(e) => setFormData({ ...formData, estilo_otro: e.target.value })}
                disabled={isFirmado}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Espacios y Distribución</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Recámaras</Label>
              <Input
                type="number"
                value={formData.recamaras}
                onChange={(e) => setFormData({ ...formData, recamaras: e.target.value })}
                disabled={isFirmado}
              />
            </div>
            <div>
              <Label>Baños</Label>
              <Input
                type="number"
                value={formData.banos}
                onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                disabled={isFirmado}
              />
            </div>
            <div>
              <Label>Niveles</Label>
              <Input
                type="number"
                value={formData.niveles}
                onChange={(e) => setFormData({ ...formData, niveles: e.target.value })}
                disabled={isFirmado}
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Espacios Adicionales</Label>
            <div className="grid grid-cols-3 gap-2">
              {ESPACIOS_ADICIONALES.map((espacio) => (
                <div key={espacio} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.espacios_adicionales.includes(espacio)}
                    onCheckedChange={() => handleCheckbox('espacios_adicionales', espacio)}
                    disabled={isFirmado}
                  />
                  <label className="text-sm">{espacio}</label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Estilo de Vida y Necesidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.mascotas}
              onCheckedChange={(checked) => setFormData({ ...formData, mascotas: checked as boolean })}
              disabled={isFirmado}
            />
            <label>Tengo mascotas</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.trabajo_casa}
              onCheckedChange={(checked) => setFormData({ ...formData, trabajo_casa: checked as boolean })}
              disabled={isFirmado}
            />
            <label>Trabajo desde casa</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.entretenimiento}
              onCheckedChange={(checked) => setFormData({ ...formData, entretenimiento: checked as boolean })}
              disabled={isFirmado}
            />
            <label>Necesito espacios de entretenimiento</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Presupuesto y Tiempos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Presupuesto Mínimo</Label>
            <Input
              type="number"
              value={formData.presupuesto_min}
              onChange={(e) => setFormData({ ...formData, presupuesto_min: e.target.value })}
              disabled={isFirmado}
            />
          </div>
          <div>
            <Label>Presupuesto Máximo</Label>
            <Input
              type="number"
              value={formData.presupuesto_max}
              onChange={(e) => setFormData({ ...formData, presupuesto_max: e.target.value })}
              disabled={isFirmado}
            />
          </div>
          <div className="col-span-2">
            <Label>Fecha Deseada de Inicio</Label>
            <Input
              type="date"
              value={formData.fecha_inicio}
              onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
              disabled={isFirmado}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Sustentabilidad y Tecnología</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.paneles_solares}
              onCheckedChange={(checked) => setFormData({ ...formData, paneles_solares: checked as boolean })}
              disabled={isFirmado}
            />
            <label>Paneles solares</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.captacion_agua}
              onCheckedChange={(checked) => setFormData({ ...formData, captacion_agua: checked as boolean })}
              disabled={isFirmado}
            />
            <label>Sistema de captación de agua</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.materiales_reciclados}
              onCheckedChange={(checked) => setFormData({ ...formData, materiales_reciclados: checked as boolean })}
              disabled={isFirmado}
            />
            <label>Materiales reciclados o ecológicos</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Comentarios Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.comentarios}
            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
            rows={4}
            placeholder="Cualquier información adicional que desee compartir..."
            disabled={isFirmado}
          />
        </CardContent>
      </Card>

      {!isFirmado && (
        <Card>
          <CardHeader>
            <CardTitle>8. Firma del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={firmaTab} onValueChange={(v) => setFirmaTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manuscrita">Firma Manuscrita</TabsTrigger>
                <TabsTrigger value="pdf">Subir PDF Firmado</TabsTrigger>
              </TabsList>
              <TabsContent value="manuscrita" className="space-y-4">
                <div className="border rounded-lg p-2 bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full h-40 border-b-2 border-dashed',
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => signatureRef.current?.clear()}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Limpiar Firma
                </Button>
              </TabsContent>
              <TabsContent value="pdf" className="space-y-4">
                <div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                  {pdfFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Archivo seleccionado: {pdfFile.name}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        {!isFirmado && (
          <>
            <Button onClick={() => handleSave(false)} variant="outline">
              <Save className="h-4 w-4 mr-2" /> Guardar Borrador
            </Button>
            <Button onClick={() => handleSave(true)}>
              Firmar y Guardar Wishlist
            </Button>
          </>
        )}
        {isFirmado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
            <p className="text-green-800 font-medium">
              ✓ Wishlist firmado el {new Date(existingWishlist.firmado_at).toLocaleDateString('es-MX')}
            </p>
            {existingWishlist.firma_url && (
              <a 
                href={existingWishlist.firma_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Ver firma
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}