import { useProjectChatParticipants, useGrantFullChatHistory, useRemoveFromChat } from "@/hooks/useProjectChatParticipants";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Crown, UserCheck, UserMinus, History, MessageSquare, Clock, UserPlus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectChatParticipantsProps {
  projectId: string;
}

export default function ProjectChatParticipants({ projectId }: ProjectChatParticipantsProps) {
  const { data: participants, isLoading } = useProjectChatParticipants(projectId);
  const grantHistory = useGrantFullChatHistory();
  const removeFromChat = useRemoveFromChat();

  const getParticipantIcon = (type: string) => {
    switch (type) {
      case 'client': return { icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'sales_advisor': return { icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    }
  };

  const getParticipantLabel = (type: string) => {
    switch (type) {
      case 'client': return 'Cliente';
      case 'sales_advisor': return 'Asesor';
      default: return 'Colaborador';
    }
  };

  const getParticipantBadgeColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-blue-500 text-white';
      case 'sales_advisor': return 'bg-amber-500 text-white';
      default: return 'bg-purple-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Participantes</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Participantes</h3>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {participants?.length || 0}
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="space-y-1 max-h-[600px] overflow-y-auto p-4">
          {participants?.map((participant) => {
            const iconConfig = getParticipantIcon(participant.participant_type);
            const Icon = iconConfig.icon;
            
            return (
              <div 
                key={participant.id} 
                className="group rounded-lg p-3 hover:bg-muted/50 transition-all duration-200 border border-transparent hover:border-border"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-border">
                      <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                      <AvatarFallback className={cn("font-semibold text-sm", iconConfig.bg, iconConfig.color)}>
                        {participant.profiles?.full_name?.substring(0, 2).toUpperCase() || 'US'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator placeholder - would need real presence tracking */}
                    {participant.participant_type === 'sales_advisor' && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {participant.profiles?.full_name || 'Usuario'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge 
                            variant="secondary" 
                            className={cn("text-[10px] px-1.5 py-0 h-5", getParticipantBadgeColor(participant.participant_type))}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {getParticipantLabel(participant.participant_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="font-medium">{participant.message_count || 0}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            Mensajes enviados
                          </TooltipContent>
                        </Tooltip>

                        {participant.last_message_at && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatDistanceToNow(new Date(participant.last_message_at), { addSuffix: true, locale: es })}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Último mensaje: {format(new Date(participant.last_message_at), "dd MMM yyyy HH:mm", { locale: es })}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>

                    {/* History restriction warning */}
                    {participant.show_history_from && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 bg-amber-500/10 rounded px-2 py-1">
                        <History className="h-3 w-3" />
                        <span>Historial desde: {format(new Date(participant.show_history_from), "dd MMM", { locale: es })}</span>
                      </div>
                    )}

                    {/* Actions (visible on hover or always for mobile) */}
                    {participant.participant_type === 'collaborator' && (
                      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          {participant.show_history_from && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => grantHistory.mutate({ 
                                    projectId, 
                                    userId: participant.user_id 
                                  })}
                                >
                                  <History className="h-3 w-3 mr-1" />
                                  Acceso total
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                Dar acceso a todo el historial
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                  if (confirm(`¿Remover a ${participant.profiles?.full_name} del chat?`)) {
                                    removeFromChat.mutate({ 
                                      projectId, 
                                      userId: participant.user_id 
                                    });
                                  }
                                }}
                              >
                                <UserMinus className="h-3 w-3 mr-1" />
                                Remover
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs">
                              Remover del chat
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Footer with add participant action */}
      <Separator />
      <div className="p-3">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => {
            // TODO: Open dialog to add participant
            alert('Funcionalidad de agregar participante próximamente');
          }}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Agregar participante
        </Button>
      </div>
    </Card>
  );
}
