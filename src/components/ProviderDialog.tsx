import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const rfcRegex = /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{3})$/;

const providerSchema = z.object({
  code_short: z
    .string()
    .trim()
    .min(1, "El código es requerido")
    .max(6, "El código debe tener máximo 6 caracteres")
    .regex(/^[A-Z0-9]+$/, "Solo letras mayúsculas y números")
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
    .max(13, "RFC inválido")
    .regex(rfcRegex, "Formato de RFC inválido")
    .optional()
    .or(z.literal("")),
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
    .email("Email inválido")
    .max(100)
    .optional()
    .or(z.literal("")),
  contacto_telefono: z.string().trim().max(20).optional().or(z.literal("")),
  contacto_puesto: z.string().trim().max(100).optional().or(z.literal("")),
});

type ProviderFormData = z.infer<typeof providerSchema>;

interface ProviderDialogProps {
  open: boolean;
  onClose: (shouldReload: boolean) => void;
  provider?: any;
}

export function ProviderDialog({ open, onClose, provider }: ProviderDialogProps) {
  const isEditing = !!provider;

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      code_short: "",
      name: "",
      activo: true,
      rfc: "",
      regimen_fiscal: "",
      razon_social: "",
      direccion_fiscal: "",
      tiempo_entrega: "",
      forma_pago: "",
      condiciones: "",
      contacto_nombre: "",
      contacto_email: "",
      contacto_telefono: "",
      contacto_puesto: "",
    },
  });

  useEffect(() => {
    if (provider) {
      form.reset({
        code_short: provider.code_short || "",
        name: provider.name || "",
        activo: provider.activo ?? true,
        rfc: provider.fiscales_json?.rfc || "",
        regimen_fiscal: provider.fiscales_json?.regimen_fiscal || "",
        razon_social: provider.fiscales_json?.razon_social || "",
        direccion_fiscal: provider.fiscales_json?.direccion_fiscal || "",
        tiempo_entrega: provider.terms_json?.tiempo_entrega || "",
        forma_pago: provider.terms_json?.forma_pago || "",
        condiciones: provider.terms_json?.condiciones || "",
        contacto_nombre: provider.contacto_json?.nombre || "",
        contacto_email: provider.contacto_json?.email || "",
        contacto_telefono: provider.contacto_json?.telefono || "",
        contacto_puesto: provider.contacto_json?.puesto || "",
      });
    } else {
      form.reset({
        code_short: "",
        name: "",
        activo: true,
        rfc: "",
        regimen_fiscal: "",
        razon_social: "",
        direccion_fiscal: "",
        tiempo_entrega: "",
        forma_pago: "",
        condiciones: "",
        contacto_nombre: "",
        contacto_email: "",
        contacto_telefono: "",
        contacto_puesto: "",
      });
    }
  }, [provider, form]);

  const onSubmit = async (data: ProviderFormData) => {
    try {
      const providerData = {
        code_short: data.code_short,
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

      if (isEditing) {
        const { error } = await supabase
          .from("providers")
          .update(providerData)
          .eq("id", provider.id);

        if (error) throw error;
        toast.success("Proveedor actualizado correctamente");
      } else {
        const { error } = await supabase.from("providers").insert([providerData]);

        if (error) {
          if (error.code === "23505") {
            toast.error("El código corto ya existe");
            return;
          }
          throw error;
        }
        toast.success("Proveedor creado correctamente");
      }

      onClose(true);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code_short"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Corto *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: PRV001"
                        maxLength={6}
                        className="uppercase font-mono"
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del proveedor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0">Proveedor activo</FormLabel>
                </FormItem>
              )}
            />

            <Tabs defaultValue="fiscales" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="fiscales">Datos Fiscales</TabsTrigger>
                <TabsTrigger value="terminos">Términos</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
              </TabsList>

              <TabsContent value="fiscales" className="space-y-4">
                <FormField
                  control={form.control}
                  name="rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="RFC123456XXX"
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
                        <Input {...field} placeholder="Razón social completa" />
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
                      <FormControl>
                        <Input {...field} placeholder="Ej: Persona Moral" />
                      </FormControl>
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
                        <Textarea {...field} placeholder="Dirección completa" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="terminos" className="space-y-4">
                <FormField
                  control={form.control}
                  name="tiempo_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiempo de Entrega</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: 5-7 días hábiles" />
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
                        <Input {...field} placeholder="Ej: Transferencia, Crédito 30 días" />
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
                          placeholder="Términos y condiciones especiales..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="contacto" className="space-y-4">
                <FormField
                  control={form.control}
                  name="contacto_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre completo" />
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
                          placeholder="contacto@ejemplo.com"
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
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
