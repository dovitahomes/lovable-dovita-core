import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTask, useUpdateTask, useTaskById } from "@/hooks/crm/useTasks";
import { toast } from "sonner";

const taskSchema = z.object({
  subject: z.string().min(1, "El asunto es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().optional(),
  due_date: z.date().optional(),
  priority: z.enum(["baja", "media", "alta"]),
  status: z.enum(["pendiente", "en_progreso", "completada", "cancelada"]),
  related_to_type: z.enum(["lead", "account", "contact", "opportunity", "project"]).optional(),
  related_to_id: z.string().optional(),
  assigned_to: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string; // For edit mode
  defaultRelatedTo?: {
    type: "lead" | "account" | "contact" | "opportunity" | "project";
    id: string;
  };
}

export function CreateTaskDialog({ open, onOpenChange, taskId, defaultRelatedTo }: CreateTaskDialogProps) {
  const isEdit = !!taskId;
  const { data: existingTask } = useTaskById(taskId || '', { enabled: isEdit });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [dateOpen, setDateOpen] = useState(false);

  const defaultValues = existingTask ? {
    subject: existingTask.subject,
    description: existingTask.description || "",
    due_date: existingTask.due_date ? new Date(existingTask.due_date) : undefined,
    priority: existingTask.priority,
    status: existingTask.status,
    related_to_type: existingTask.related_to_type,
    related_to_id: existingTask.related_to_id || undefined,
    assigned_to: existingTask.assigned_to || undefined,
  } : {
    priority: "media" as const,
    status: "pendiente" as const,
    related_to_type: defaultRelatedTo?.type,
    related_to_id: defaultRelatedTo?.id,
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  const selectedDate = watch("due_date");
  const selectedPriority = watch("priority");
  const selectedStatus = watch("status");

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (isEdit) {
        await updateTask.mutateAsync({
          id: taskId,
          subject: data.subject,
          description: data.description,
          due_date: data.due_date?.toISOString(),
          priority: data.priority,
          status: data.status,
          related_to_type: data.related_to_type,
          related_to_id: data.related_to_id,
          assigned_to: data.assigned_to,
        });
        toast.success("Tarea actualizada correctamente");
      } else {
        await createTask.mutateAsync({
          subject: data.subject,
          description: data.description,
          due_date: data.due_date?.toISOString(),
          priority: data.priority,
          status: data.status,
          related_to_type: data.related_to_type,
          related_to_id: data.related_to_id,
          assigned_to: data.assigned_to,
        });
        toast.success("Tarea creada correctamente");
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Error al actualizar tarea" : "Error al crear tarea");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject */}
          <div>
            <Label htmlFor="subject">
              Asunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder="Ej: Llamar a cliente para seguimiento"
            />
            {errors.subject && (
              <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Detalles adicionales..."
              rows={3}
            />
          </div>

          {/* Due Date */}
          <div>
            <Label>Fecha de Vencimiento</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setValue("due_date", date);
                    setDateOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <Label>Prioridad</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label>Estado</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEdit ? "Actualizar" : "Crear Tarea"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
