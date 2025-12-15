import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StickyNote } from "lucide-react";
import type { LeadNote } from "@/hooks/crm/useLeadNotes";
import { getAvatarPublicUrl } from "@/lib/storage/avatar-url";

interface NoteCardProps {
  note: LeadNote;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??';
}

export function NoteCard({ note }: NoteCardProps) {
  const performerName = note.performer?.full_name || 'Usuario desconocido';
  const timeAgo = formatDistanceToNow(new Date(note.created_at), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200 bg-card border-border">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
          <AvatarImage src={getAvatarPublicUrl(note.performer?.avatar_url)} alt={performerName} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-orange-500 text-white text-sm font-semibold">
            {getInitials(performerName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{performerName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {note.description}
          </p>
        </div>
        
        <StickyNote className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
      </div>
    </Card>
  );
}
