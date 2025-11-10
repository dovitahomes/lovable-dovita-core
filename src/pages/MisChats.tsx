import { useState } from "react";
import { useMyProjectChats } from "@/hooks/useMyProjectChats";
import useProjectChat from "@/features/client/hooks/useProjectChat";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageSquare, Crown, Users as UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectChatParticipants from "@/components/project/ProjectChatParticipants";

export default function MisChats() {
  const { data: chats, isLoading: chatsLoading } = useMyProjectChats();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const { messages, loading: messagesLoading, sending, sendMessage } = useProjectChat(selectedProjectId);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedProjectId) return;
    
    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getParticipantTypeIcon = (type: string) => {
    if (type === 'sales_advisor') return <Crown className="h-3 w-3 text-amber-500" />;
    if (type === 'client') return null;
    return <UsersIcon className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Mis Chats</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Lista de Chats */}
        <Card className="lg:col-span-3 p-0 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Proyectos</h2>
            <p className="text-sm text-muted-foreground">
              {chats?.length || 0} conversaciones
            </p>
          </div>

          <ScrollArea className="flex-1">
            {chatsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : chats?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>No tienes chats disponibles</p>
              </div>
            ) : (
              <div className="p-2">
                {chats?.map((chat) => (
                  <button
                    key={chat.project_id}
                    onClick={() => setSelectedProjectId(chat.project_id)}
                    className={`w-full p-3 rounded-lg text-left hover:bg-muted transition-colors ${
                      selectedProjectId === chat.project_id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {chat.projects.clients.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {chat.projects.clients.name}
                          </p>
                          {getParticipantTypeIcon(chat.participant_type)}
                        </div>
                        
                        {chat.last_message_preview ? (
                          <p className="text-xs text-muted-foreground truncate">
                            <span className="font-medium">{chat.last_message_sender}:</span> {chat.last_message_preview}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Sin mensajes aún
                          </p>
                        )}
                        
                        {chat.last_message_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(chat.last_message_at), "dd MMM HH:mm", { locale: es })}
                          </p>
                        )}
                      </div>

                      {chat.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-auto shrink-0">
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Panel de Chat */}
        <Card className="lg:col-span-6 p-0 flex flex-col">
          {!selectedProjectId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Selecciona un chat para comenzar</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No hay mensajes aún. Inicia la conversación.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="flex flex-col space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm">Usuario</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.created_at), "dd MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="min-h-[60px] resize-none"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="h-[60px] w-[60px]"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Panel de Participantes */}
        <div className="lg:col-span-3">
          {selectedProjectId ? (
            <ProjectChatParticipants projectId={selectedProjectId} />
          ) : (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                Selecciona un chat para ver los participantes
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
