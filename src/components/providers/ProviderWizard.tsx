import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ProviderWizardProps {
  open: boolean;
  onClose: (shouldReload: boolean) => void;
  provider?: any;
}

const STEPS = [
  { id: 1, name: "Información Básica" },
  { id: 2, name: "Datos Fiscales" },
  { id: 3, name: "Contacto" },
  { id: 4, name: "Términos" },
];

export function ProviderWizard({ open, onClose, provider }: ProviderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualRegimen, setIsManualRegimen] = useState(false);
  const isEditing = !!provider;

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    mode: "onChange",
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
      setCurrentStep(1);
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
      setCurrentStep(1);
    }
  }, [provider, form, open]);

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof ProviderFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ["code_short", "name", "activo"];
        break;
      case 2:
        fieldsToValidate = ["rfc", "regimen_fiscal", "razon_social", "direccion_fiscal"];
        break;
      case 3:
        // Contact fields are optional, always return true
        return true;
      case 4:
        fieldsToValidate = ["tiempo_entrega", "forma_pago", "condiciones"];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (step: number): boolean => {
    const values = form.getValues();
    switch (step) {
      case 1:
        return !!values.code_short && !!values.name;
      case 2:
        // Fiscal data is optional, so always complete
        return true;
      case 3:
        // Contact data is optional, so always complete
        return true;
      case 4:
        // Terms data is optional, so always complete
        return true;
      default:
        return false;
    }
  };

  const onSubmit = async (data: ProviderFormData) => {
    setIsSubmitting(true);
    try {
      // Check for duplicate name before insert/update
      if (!isEditing && data.name) {
        const { data: similar } = await supabase
          .from("providers")
          .select("id, name")
          .ilike("name", `%${data.name}%`)
          .limit(1)
          .maybeSingle();

        if (similar) {
          const confirm = window.confirm(
            `Ya existe un proveedor similar: "${similar.name}". ¿Desea continuar de todos modos?`
          );
          if (!confirm) {
            setIsSubmitting(false);
            return;
          }
        }
      }

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

      // Only add code_short for new providers
      if (!isEditing) {
        providerData.code_short = data.code_short;
      }

      if (isEditing) {
        const { error } = await supabase
          .from("providers")
          .update(providerData)
          .eq("id", provider.id);

        if (error) throw error;
        toast.success("Proveedor actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("providers")
          .insert([providerData]);

        if (error) throw error;
        toast.success("Proveedor creado correctamente");
      }

      onClose(true);
    } catch (error: any) {
      console.error("Error saving provider:", error);
      toast.error(error.message || "Error al guardar proveedor");
    } finally {
      setIsSubmitting(false);
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

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <Badge
                  variant={currentStep === step.id ? "default" : "secondary"}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
                    isStepComplete(step.id) && currentStep > step.id && "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {isStepComplete(step.id) && currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    step.id
                  )}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1 hidden md:block">
                  {step.name}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div className="h-0.5 w-8 md:w-12 bg-border mx-1" />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Información Básica */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
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
                          className="uppercase"
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
              </div>
            )}

            {/* Step 2: Datos Fiscales */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-fade-in">
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
              </div>
            )}

            {/* Step 3: Contacto */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-muted-foreground mb-4">
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
              </div>
            )}

            {/* Step 4: Términos y Preview */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
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

                {/* Preview */}
                <Card className="mt-6 bg-muted/50">
                  <CardContent className="pt-6">
                    <Label className="text-sm font-semibold mb-3 block">
                      Vista Previa del Proveedor
                    </Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Código:</span>
                        <span className="font-mono font-semibold">
                          {form.watch("code_short") || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre:</span>
                        <span className="font-semibold">
                          {form.watch("name") || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RFC:</span>
                        <span className="font-mono">
                          {form.watch("rfc") || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{form.watch("contacto_email") || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge variant={form.watch("activo") ? "default" : "secondary"}>
                          {form.watch("activo") ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Anterior
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStep < 4 ? (
                  <Button type="button" onClick={handleNext}>
                    Siguiente
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Actualizar Proveedor" : "Guardar Proveedor"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
