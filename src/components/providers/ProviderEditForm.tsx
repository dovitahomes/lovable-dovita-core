import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { REGIMENES_FISCALES } from "@/lib/constants/regimenes-fiscales";

const rfcRegex = /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{3})$/;

const providerSchema = z.object({
  code_short: z
    .string()
    .trim()
    .min(1, "El código es requerido")
    .max(6, "El código debe tener máximo 6 caracteres")
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, "El nombre es requerido")
    .max(200, "El nombre debe tener máximo 200 caracteres"),
  activo: z.boolean().default(true),
  // Fiscales
  rfc: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val === "" || rfcRegex.test(val),
      { message: "Formato de RFC inválido (ej: XAXX010101000)" }
    ),
  regimen_fiscal: z.string().trim().max(100).optional().or(z.literal("")),
  razon_social: z.string().trim().max(200).optional().or(z.literal("")),
  direccion_fiscal: z.string().trim().max(300).optional().or(z.literal("")),
  // Términos
  tiempo_entrega: z.string().trim().max(100).optional().or(z.literal("")),
  forma_pago: z.string().trim().max(100).optional().or(z.literal("")),
  condiciones: z.string().trim().max(500).optional().or(z.literal("")),
  // Contacto
  contacto_nombre: z.string().trim().max(100).optional().or(z.literal("")),
  contacto_email: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      { message: "Email inválido" }
    ),
  contacto_telefono: z.string().trim().max(20).optional().or(z.literal("")),
  contacto_puesto: z.string().trim().max(100).optional().or(z.literal("")),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface ProviderEditFormProps {
  open: boolean;
  onClose: (shouldReload: boolean) => void;
  provider: any;
}

export function ProviderEditForm({ open, onClose, provider }: ProviderEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualRegimen, setIsManualRegimen] = useState(false);

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    mode: "onChange",
    defaultValues: {
      code_short: provider?.code_short || "",
      name: provider?.name || "",
      activo: provider?.activo ?? true,
      rfc: provider?.fiscales_json?.rfc || "",
      regimen_fiscal: provider?.fiscales_json?.regimen_fiscal || "",
      razon_social: provider?.fiscales_json?.razon_social || "",
      direccion_fiscal: provider?.fiscales_json?.direccion_fiscal || "",
      tiempo_entrega: provider?.terms_json?.tiempo_entrega || "",
      forma_pago: provider?.terms_json?.forma_pago || "",
      condiciones: provider?.terms_json?.condiciones || "",
      contacto_nombre: provider?.contacto_json?.nombre || "",
      contacto_email: provider?.contacto_json?.email || "",
      contacto_telefono: provider?.contacto_json?.telefono || "",
      contacto_puesto: provider?.contacto_json?.puesto || "",
    },
  });

  const hasBasicData = form.watch("code_short") && form.watch("name");
  const hasFiscalData = form.watch("rfc") || form.watch("regimen_fiscal") || form.watch("razon_social");
  const hasContactData = form.watch("contacto_nombre") || form.watch("contacto_email") || form.watch("contacto_telefono");
  const hasTermsData = form.watch("tiempo_entrega") || form.watch("forma_pago") || form.watch("condiciones");

  const onSubmit = async (data: ProviderFormData) => {
    setIsSubmitting(true);
    try {
      const providerData: any = {
        name: data.name,
        activo: data.activo,
        fiscales_json: {
          rfc: data.rfc || null,
          regimen_fiscal: data.regimen_fiscal || null,
          razon_social: data.razon_social || null,
          direccion_fiscal: data.direccion_fiscal || null,
        },
        terms_json: {
          tiempo_entrega: data.tiempo_entrega || null,
          forma_pago: data.forma_pago || null,
          condiciones: data.condiciones || null,
        },
        contacto_json: {
          nombre: data.contacto_nombre || null,
          email: data.contacto_email || null,
          telefono: data.contacto_telefono || null,
          puesto: data.contacto_puesto || null,
        },
      };

      const { error } = await supabase
        .from("providers")
        .update(providerData)
        .eq("id", provider.id);

      if (error) throw error;
      toast.success("Proveedor actualizado correctamente");
      onClose(true);
    } catch (error: any) {
      console.error("Error updating provider:", error);
      toast.error(error.message || "Error al actualizar proveedor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar Proveedor
            <Badge variant={provider?.activo ? "default" : "secondary"}>
              {provider?.activo ? "Activo" : "Inactivo"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basicos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1">
                <TabsTrigger value="basicos" className="gap-2">
                  Básicos
                  {hasBasicData && <CheckCircle className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="fiscales" className="gap-2">
                  Fiscales
                  {hasFiscalData && <CheckCircle className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="contacto" className="gap-2">
                  Contacto
                  {hasContactData && <CheckCircle className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="terminos" className="gap-2">
                  Términos
                  {hasTermsData && <CheckCircle className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Información Básica */}
              <TabsContent value="basicos" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="code_short"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Corto *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Máx. 6 caracteres (ej: PROV01)"
                              maxLength={6}
                              className="uppercase font-mono"
                              disabled
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            El código no puede modificarse una vez creado
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Proveedor *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre completo del proveedor" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="activo"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Estado Activo</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              El proveedor estará disponible para usar en presupuestos
                            </p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Datos Fiscales */}
              <TabsContent value="fiscales" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="rfc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RFC</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="XAXX010101000"
                              maxLength={13}
                              className="uppercase font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="razon_social"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razón Social</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Razón social del proveedor" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="regimen_fiscal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Régimen Fiscal</FormLabel>
                          <Select
                            value={isManualRegimen ? "manual" : (field.value || "")}
                            onValueChange={(value) => {
                              if (value === "manual") {
                                setIsManualRegimen(true);
                                field.onChange("");
                              } else {
                                setIsManualRegimen(false);
                                field.onChange(value);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Selecciona un régimen fiscal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover max-h-[300px]">
                              {REGIMENES_FISCALES.map((regimen) => (
                                <SelectItem 
                                  key={regimen.value} 
                                  value={regimen.value}
                                  className="hover:bg-accent"
                                >
                                  {regimen.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {isManualRegimen && (
                            <div className="mt-2 animate-fade-in">
                              <Input
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Escribe el régimen fiscal manualmente"
                                className="border-primary/50"
                              />
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="direccion_fiscal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección Fiscal</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Dirección completa del domicilio fiscal"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Contacto */}
              <TabsContent value="contacto" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Todos los campos de contacto son opcionales
                    </p>

                    <FormField
                      control={form.control}
                      name="contacto_nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de Contacto</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nombre completo del contacto" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contacto_puesto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Puesto</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Gerente de Ventas" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contacto_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contacto@proveedor.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contacto_telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(55) 1234-5678" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Términos */}
              <TabsContent value="terminos" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="tiempo_entrega"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tiempo de Entrega</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: 15 días hábiles" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="forma_pago"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pago</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: 50% anticipo, 50% contra entrega" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="condiciones"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condiciones Adicionales</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Garantías, devoluciones, políticas especiales..."
                              rows={4}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
