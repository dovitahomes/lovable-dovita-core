import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockProjectData } from '@/lib/client-data';
import { MessageCircle } from 'lucide-react';

export default function Chat() {
  const conversations = mockProjectData.team.map(member => ({
    ...member,
    lastMessage: 'Hola, ¿en qué puedo ayudarte?',
    timestamp: '10:30 AM',
    unread: Math.floor(Math.random() * 3)
  }));

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mensajes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comunícate con tu equipo de proyecto
        </p>
      </div>

      <div className="space-y-2">
        {conversations.map((conversation) => (
          <Card key={conversation.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="h-12 w-12 rounded-full"
                />
                {conversation.unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-secondary text-primary text-xs">
                    {conversation.unread}
                  </Badge>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-semibold text-sm">{conversation.name}</p>
                    <p className="text-xs text-muted-foreground">{conversation.role}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state for chat group */}
      <Card className="p-8 text-center">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Selecciona una conversación para comenzar
        </p>
      </Card>
    </div>
  );
}
