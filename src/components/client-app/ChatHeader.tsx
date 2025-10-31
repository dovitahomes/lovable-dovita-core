import { Button } from '@/components/ui/button';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { mockProjectData } from '@/lib/client-data';

export default function ChatHeader() {
  const teamMembers = mockProjectData.team;

  return (
    <div className="bg-card border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Team Avatars */}
        <div className="flex -space-x-2">
          {teamMembers.slice(0, 3).map((member) => (
            <img
              key={member.id}
              src={member.avatar}
              alt={member.name}
              className="h-10 w-10 rounded-full border-2 border-background"
            />
          ))}
          {teamMembers.length > 3 && (
            <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">
                +{teamMembers.length - 3}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">
            Equipo - {mockProjectData.name}
          </h2>
          <p className="text-xs text-muted-foreground truncate">
            {teamMembers.length} participantes
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
