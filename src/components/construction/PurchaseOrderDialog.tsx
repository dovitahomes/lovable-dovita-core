import { useEffect, useState } from "react";
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
import { toast } from "sonner";

const purchaseOrderSchema = z.object({
  qty_solicitada: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  fecha_requerida: z.string().optional(),
  proveedor_id: z.string().optional(),
  notas: z.string().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseOrderDialogProps {
  open: boolean;
  onClose: (reload: boolean) => void;
  projectId: string;
  budgetItem: any;
}

export function PurchaseOrderDialog({
  open,
  onClose,
  projectId,
  budgetItem,
}: PurchaseOrderDialogProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [maxQty, setMaxQty] = useState(0);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      qty_solicitada: 0,
      fecha_requerida: "",
      proveedor_id: "",
      notas: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadProviders();
      if (budgetItem) {
        setMaxQty(budgetItem.cant_necesaria || 0);
      }
    }
  }, [open, budgetItem]);

  const loadProviders = async () => {
    const { data } = await supabase
      .from("providers")
      .select("id, code_short, name")
      .eq("activo", true)
      .order("name");
    
    setProviders(data || []);
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    if (!budgetItem) return;

    if (data.qty_solicitada > maxQty) {
      toast.error(`La cantidad no puede exceder ${maxQty} ${budgetItem.unidad}`);
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase.from("purchase_orders").insert({
        project_id: projectId,
        subpartida_id: budgetItem.subpartida_id,
        qty_solicitada: data.qty_solicitada,
        fecha_requerida: data.fecha_requerida || null,
        proveedor_id: data.proveedor_id || null,
        notas: data.notas || null,
        created_by: user?.user?.id || null,
      });

      if (error) throw error;

      toast.success("Orden de compra creada");
      form.reset();
      onClose(true);
    } catch (error: any) {
      toast.error("Error al crear orden: " + error.message);
    }
  };

  if (!budgetItem) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="font-semibold">{budgetItem.tu_nodes?.name}</p>
          <p className="text-sm text-muted-foreground">
            Máximo disponible: {maxQty} {budgetItem.unidad}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qty_solicitada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad Solicitada *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fecha_requerida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Requerida</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code_short} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Orden</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
