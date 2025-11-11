import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTask } from "@/hooks/crm/useTasks";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  template: z.string().optional(),
  customDate: z.date().optional(),
  description: z.string().optional(),
});

interface CreateFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

const QUICK_TEMPLATES = [
  { label: "Llamar mañana", days: 1 },
  { label: "Seguimiento 3 días", days: 3 },
  { label: "Revisión semanal", days: 7 },
  { label: "Follow-up 2 semanas", days: 14 },
  { label: "Fecha personalizada", days: null },
];

export function CreateFollowUpDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
}: CreateFollowUpDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const createTask = useCreateTask();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: "",
      description: "",
    },
  });

  const handleTemplateSelect = (index: number) => {
    setSelectedTemplate(index);
    const template = QUICK_TEMPLATES[index];
    form.setValue("template", template.label);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const template = QUICK_TEMPLATES[selectedTemplate!];
    let dueDate: Date;

    if (template.days === null) {
      // Custom date
      if (!values.customDate) {
        form.setError("customDate", { message: "Selecciona una fecha" });
        return;
      }
      dueDate = values.customDate;
    } else {
      // Quick template
      dueDate = addDays(new Date(), template.days);
    }

    await createTask.mutateAsync({
      subject: `Seguimiento: ${leadName}`,
      description: values.description || template.label,
      due_date: dueDate.toISOString(),
      priority: 'alta',
      status: 'pendiente',
      related_to_type: 'lead',
      related_to_id: leadId,
    });

    onOpenChange(false);
    form.reset();
    setSelectedTemplate(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Programar Seguimiento</DialogTitle>
          <DialogDescription>
            Crea un recordatorio para dar seguimiento a {leadName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel>Plantillas Rápidas</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_TEMPLATES.map((template, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={selectedTemplate === index ? "default" : "outline"}
                    onClick={() => handleTemplateSelect(index)}
                    className="justify-start text-sm"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>

            {selectedTemplate === QUICK_TEMPLATES.length - 1 && (
              <FormField
                control={form.control}
                name="customDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Personalizada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Agrega detalles adicionales..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={selectedTemplate === null || createTask.isPending}
              >
                {createTask.isPending ? "Creando..." : "Crear Recordatorio"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
