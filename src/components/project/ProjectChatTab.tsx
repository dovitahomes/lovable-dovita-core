import { useCheckCollaboratorAccess } from "@/hooks/useProjectCollaborators";
import useProjectChat from "@/features/client/hooks/useProjectChat";
import { useProjectChatParticipants } from "@/hooks/useProjectChatParticipants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import ProjectChatParticipants from "./ProjectChatParticipants";
import ERPChatHeader from "./ERPChatHeader";
import ERPChatMessage from "./ERPChatMessage";
import ERPChatInput from "./ERPChatInput";
import { supabase } from "@/integrations/supabase/client";

interface ProjectChatTabProps {
  projectId: string;
}

export default function ProjectChatTab({ projectId }: ProjectChatTabProps) {
  const { data: hasAccess, isLoading: checkingAccess } = useCheckCollaboratorAccess(projectId);
  const { messages, loading, error, sending, sendMessage } = useProjectChat(projectId);
  const { data: participants = [] } = useProjectChatParticipants(projectId);
  
  const [showParticipants, setShowParticipants] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);
  
  // Smart auto-scroll: only if user is near bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track scroll position
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSendMessage = async (
    text: string, 
    attachments?: Array<{ name: string; url: string; size: number; type: string }>
  ) => {
    try {
      await sendMessage(text, attachments);
      shouldAutoScrollRef.current = true; // Force scroll on send
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};
    
    messages.forEach(message => {
      const messageDate = new Date(message.created_at);
      const dateKey = format(messageDate, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Hoy';
    } else if (isYesterday(date)) {
      return 'Ayer';
    } else {
      return format(date, "d 'de' MMMM", { locale: es });
    }
  };

  const groupedMessages = groupMessagesByDate();
  
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Chat del Proyecto</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={showParticipants ? "lg:col-span-2" : "lg:col-span-3"}>
          <Card className="p-0 h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <ERPChatHeader 
              projectName={`Proyecto ${projectId.slice(0, 8)}...`}
              participants={participants.filter(p => p.profiles) as any}
              onViewParticipants={() => setShowParticipants(!showParticipants)}
            />

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
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
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h4 className="font-medium text-muted-foreground mb-2">No hay mensajes</h4>
                  <p className="text-sm text-muted-foreground">
                    Inicia la conversación con tu equipo enviando un mensaje.
                  </p>
                </div>
              ) : (
                <div>
                  {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                    <div key={dateKey}>
                      {/* Date Separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-muted px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getDateLabel(dateKey)}
                          </span>
                        </div>
                      </div>

                      {/* Messages for this date */}
                      {dateMessages.map((message) => (
                        <ERPChatMessage 
                          key={message.id} 
                          message={message}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
        
            {/* Input Area */}
            <ERPChatInput 
              onSendMessage={handleSendMessage}
              disabled={sending || loading}
            />
          </Card>
        </div>
        
        {showParticipants && (
          <div className="lg:col-span-1">
            <ProjectChatParticipants projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}
