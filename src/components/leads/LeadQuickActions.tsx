import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, StickyNote, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeadQuickActionsProps {
  leadId: string;
}

export function LeadQuickActions({ leadId }: LeadQuickActionsProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const queryClient = useQueryClient();

  const logActivityMutation = useMutation({
    mutationFn: async ({ 
      activityType, 
      description 
    }: { 
      activityType: 'call_made' | 'email_sent' | 'note_added'; 
      description: string;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: activityType,
          entity_type: 'lead',
          entity_id: leadId,
          description,
          performed_by: userId,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-activities'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      
      const messages = {
        call_made: "Llamada registrada exitosamente",
        email_sent: "Email registrado exitosamente",
        note_added: "Nota agregada exitosamente",
      };
      toast.success(messages[variables.activityType]);
    },
    onError: (error: any) => {
      toast.error("Error al registrar actividad: " + error.message);
    }
  });

  const handleCall = () => {
    logActivityMutation.mutate({
      activityType: 'call_made',
      description: 'Llamada telefónica realizada'
    });
  };

  const handleEmail = () => {
    logActivityMutation.mutate({
      activityType: 'email_sent',
      description: 'Email enviado'
    });
  };

  const handleNoteSubmit = () => {
    if (!noteText.trim()) {
      toast.error("La nota no puede estar vacía");
      return;
    }
    
    logActivityMutation.mutate({
      activityType: 'note_added',
      description: noteText
    });
    
    setNoteText("");
    setNoteOpen(false);
  };

  const isLoading = logActivityMutation.isPending;

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCall}
        disabled={isLoading}
        className="h-8 w-8 p-0 hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleEmail}
        disabled={isLoading}
        className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
      </Button>

      <Popover open={noteOpen} onOpenChange={setNoteOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400"
          >
            <StickyNote className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Agregar Nota Rápida</h4>
            <Textarea
              placeholder="Escribe tu nota aquí..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNoteOpen(false);
                  setNoteText("");
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleNoteSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
