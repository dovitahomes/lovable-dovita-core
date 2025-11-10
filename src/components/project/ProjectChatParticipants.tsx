import { useProjectChatParticipants, useGrantFullChatHistory, useRemoveFromChat } from "@/hooks/useProjectChatParticipants";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, Crown, UserCheck, UserMinus, History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectChatParticipantsProps {
  projectId: string;
}

export default function ProjectChatParticipants({ projectId }: ProjectChatParticipantsProps) {
  const { data: participants, isLoading } = useProjectChatParticipants(projectId);
  const grantHistory = useGrantFullChatHistory();
  const removeFromChat = useRemoveFromChat();

  const getParticipantIcon = (type: string) => {
    switch (type) {
      case 'client': return <UserCheck className="h-4 w-4 text-primary" />;
      case 'sales_advisor': return <Crown className="h-4 w-4 text-amber-500" />;
      default: return <Users className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getParticipantLabel = (type: string) => {
    switch (type) {
      case 'client': return 'Cliente';
      case 'sales_advisor': return 'Asesor de Ventas';
      default: return 'Colaborador';
    }
  };

  if (isLoading) return <div className="p-4">Cargando participantes...</div>;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5" />
        <h3 className="font-semibold">Participantes del Chat</h3>
        <Badge variant="secondary">{participants?.length || 0}</Badge>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {participants?.map((participant) => (
          <div key={participant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {participant.profiles?.full_name?.substring(0, 2).toUpperCase() || 'US'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {participant.profiles?.full_name || 'Usuario'}
                  </p>
                  {getParticipantIcon(participant.participant_type)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getParticipantLabel(participant.participant_type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Se unió: {format(new Date(participant.joined_at), "dd MMM yyyy", { locale: es })}
                </p>
                {participant.show_history_from && (
                  <p className="text-xs text-amber-600">
                    Ve mensajes desde: {format(new Date(participant.show_history_from), "dd MMM yyyy", { locale: es })}
                  </p>
                )}
              </div>
            </div>

            {participant.participant_type === 'collaborator' && (
              <div className="flex gap-1">
                {participant.show_history_from && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => grantHistory.mutate({ 
                      projectId, 
                      userId: participant.user_id 
                    })}
                    title="Dar acceso a todo el historial"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromChat.mutate({ 
                    projectId, 
                    userId: participant.user_id 
                  })}
                  title="Remover del chat"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
