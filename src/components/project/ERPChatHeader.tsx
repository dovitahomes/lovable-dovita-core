import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Users } from 'lucide-react';

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
  projectName: string;
  participants: Participant[];
  onViewParticipants?: () => void;
}

export default function ERPChatHeader({ 
  projectName, 
  participants,
  onViewParticipants 
}: ERPChatHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Participant avatars */}
          <div className="flex -space-x-2">
            {participants.slice(0, 3).map((participant) => (
              <Avatar key={participant.id} className="h-10 w-10 border-2 border-background">
                <AvatarImage src={participant.profiles.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(participant.profiles.full_name || participant.profiles.email)}
                </AvatarFallback>
              </Avatar>
            ))}
            {participants.length > 3 && (
              <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{participants.length - 3}
                </span>
              </div>
            )}
          </div>

          {/* Project info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{projectName}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{participants.length} participante{participants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewParticipants}>
              <Users className="h-4 w-4 mr-2" />
              Ver participantes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
