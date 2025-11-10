import { useCheckCollaboratorAccess } from "@/hooks/useProjectCollaborators";
import useProjectChat from "@/features/client/hooks/useProjectChat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ProjectChatParticipants from "./ProjectChatParticipants";

interface ProjectChatTabProps {
  projectId: string;
}

export default function ProjectChatTab({ projectId }: ProjectChatTabProps) {
  const { data: hasAccess, isLoading: checkingAccess } = useCheckCollaboratorAccess(projectId);
  const { messages, loading, error, sending, sendMessage } = useProjectChat(projectId);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
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
  
  if (checkingAccess) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!hasAccess) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No tienes acceso a este chat. Solo los colaboradores asignados pueden ver y escribir mensajes.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Chat del Proyecto</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-0 h-[600px] flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
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
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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
      </Card>
        </div>
        
        <div className="lg:col-span-1">
          <ProjectChatParticipants projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
