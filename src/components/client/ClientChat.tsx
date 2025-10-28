import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useProjectChat } from "@/features/client/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientChatProps {
  projectId: string;
}

export function ClientChat({ projectId }: ClientChatProps) {
  const { messages, loading, sending, sendMessage, currentUserId } = useProjectChat(projectId);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage.trim());
      setNewMessage("");
    } catch (error) {
      // Error already handled in the hook
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-280px)] md:h-[600px]">
      <CardContent className="flex-1 flex flex-col min-h-0 gap-4 p-3 md:p-4 pt-6">
        <ScrollArea ref={scrollRef} className="flex-1 pr-3" aria-live="polite">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Cargando mensajes" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" aria-hidden="true" />
              <p className="text-lg font-medium mb-2">No hay mensajes aún</p>
              <p className="text-sm">¡Inicia la conversación con el equipo del proyecto!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 md:gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(msg.sender?.full_name, msg.sender?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">
                          {msg.sender?.full_name || msg.sender?.email || 'Usuario'}
                        </span>
                        <time dateTime={msg.created_at}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: es })}
                        </time>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 md:px-4 md:py-3 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            className="flex-1"
            aria-label="Mensaje"
          />
          <Button 
            type="submit" 
            disabled={sending || !newMessage.trim()} 
            size="icon"
            aria-label="Enviar mensaje"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
