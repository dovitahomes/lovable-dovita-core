import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Phone, PhoneOff, PhoneMissed } from "lucide-react";
import { toast } from "sonner";

interface CallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

type CallOutcome = 'successful' | 'no_answer' | 'voicemail' | 'wrong_number' | 'callback_requested';

const CALL_OUTCOMES = [
  { value: 'successful', label: 'Llamada exitosa', icon: Phone, color: 'text-green-600' },
  { value: 'no_answer', label: 'No contestó', icon: PhoneMissed, color: 'text-yellow-600' },
  { value: 'voicemail', label: 'Dejé mensaje', icon: PhoneOff, color: 'text-blue-600' },
  { value: 'wrong_number', label: 'Número equivocado', icon: PhoneOff, color: 'text-red-600' },
  { value: 'callback_requested', label: 'Solicita callback', icon: Phone, color: 'text-purple-600' },
] as const;

export function CallLogDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
}: CallLogDialogProps) {
  const [outcome, setOutcome] = useState<CallOutcome>('successful');
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const logCallMutation = useMutation({
    mutationFn: async () => {
      const selectedOutcome = CALL_OUTCOMES.find(o => o.value === outcome);
      const description = `Llamada realizada: ${selectedOutcome?.label}${notes ? ` - ${notes}` : ''}`;

      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: 'call_made',
          entity_type: 'lead',
          entity_id: leadId,
          description,
          metadata_json: {
            outcome,
            notes: notes.trim() || null,
            duration_seconds: null, // Placeholder para duración futura
          },
          performed_by: userId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Llamada registrada exitosamente");
      
      // Reset form
      setOutcome('successful');
      setNotes("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error al registrar llamada: " + error.message);
    }
  });

  const handleSave = () => {
    logCallMutation.mutate();
  };

  const handleCancel = () => {
    setOutcome('successful');
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-green-600" />
            Registrar Llamada - {leadName}
          </DialogTitle>
          <DialogDescription>
            Documenta el resultado de tu llamada telefónica con este lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resultado de la llamada */}
          <div className="space-y-3">
            <Label>Resultado de la llamada</Label>
            <RadioGroup value={outcome} onValueChange={(val) => setOutcome(val as CallOutcome)}>
              {CALL_OUTCOMES.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 flex-1 cursor-pointer"
                    >
                      <Icon className={`h-4 w-4 ${option.color}`} />
                      <span className="font-normal">{option.label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Notas de la llamada */}
          <div className="space-y-2">
            <Label htmlFor="call-notes">
              Notas de la llamada
              <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
            </Label>
            <Textarea
              id="call-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué se discutió? ¿Próximos pasos? ¿Información importante?"
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>

          {/* Quick tips */}
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-xs text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">💡 Buenas prácticas:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Registra cada llamada para seguimiento preciso</li>
              <li>Documenta objeciones y preguntas clave</li>
              <li>Si solicitó callback, crea un recordatorio</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={logCallMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={logCallMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {logCallMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Registrar Llamada
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
