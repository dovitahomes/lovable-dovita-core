import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Users, Search, Info, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  user_id: string;
  participant_type: 'client' | 'sales_advisor' | 'collaborator';
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface ERPChatHeaderProps {
  projectId: string;
  projectName: string;
  participants: Participant[];
  onViewParticipants?: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  'planning': 'Planeación',
  'design': 'Diseño',
  'budgeting': 'Presupuesto',
  'construction': 'Construcción',
  'completed': 'Completado'
};

const PHASE_COLORS: Record<string, string> = {
  'planning': 'bg-blue-500',
  'design': 'bg-purple-500',
  'budgeting': 'bg-amber-500',
  'construction': 'bg-orange-500',
  'completed': 'bg-green-500'
};

export default function ERPChatHeader({ 
  projectId,
  projectName, 
  participants,
  onViewParticipants 
}: ERPChatHeaderProps) {
  const navigate = useNavigate();
  
  // Fetch project details for phase
  const { data: projectData } = useQuery({
    queryKey: ['project-header-info', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('status')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getParticipantTypeLabel = (type: string) => {
    switch (type) {
      case 'client': return 'Cliente';
      case 'sales_advisor': return 'Asesor';
      case 'collaborator': return 'Colaborador';
      default: return '';
    }
  };

  const phase = projectData?.status || 'planning';

  return (
    <div className="border-b bg-background">
      {/* Main header row */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Participant avatars with tooltips */}
          <TooltipProvider>
            <div className="flex -space-x-3">
              {participants.slice(0, 4).map((participant) => (
                <Tooltip key={participant.id}>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar className={cn(
                        "h-10 w-10 border-2 border-background cursor-help transition-transform hover:scale-110 hover:z-10",
                        "ring-2 ring-transparent hover:ring-primary/20"
                      )}>
                        <AvatarImage src={participant.profiles.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                          {getInitials(participant.profiles.full_name || participant.profiles.email)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator (placeholder - would need real presence data) */}
                      {participant.participant_type === 'sales_advisor' && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{participant.profiles.full_name || participant.profiles.email}</p>
                      <p className="text-muted-foreground">{getParticipantTypeLabel(participant.participant_type)}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              {participants.length > 4 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-10 w-10 rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center cursor-help hover:scale-110 transition-transform">
                      <span className="text-xs font-bold text-primary">
                        +{participants.length - 4}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <p>{participants.length - 4} participante{participants.length - 4 !== 1 ? 's' : ''} más</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>

          {/* Project info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-base truncate">{projectName}</h3>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium text-white",
                  PHASE_COLORS[phase] || "bg-gray-500"
                )}
              >
                {PHASE_LABELS[phase] || phase}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{participants.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => {/* TODO: Implement search */}}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Buscar en chat</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => navigate(`/proyectos/${projectId}`)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Ver detalles del proyecto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewParticipants}>
                <Users className="h-4 w-4 mr-2" />
                Ver participantes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/proyectos/${projectId}`)}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Ir al proyecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
