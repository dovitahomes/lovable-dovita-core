import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMyProjectChats } from "@/hooks/useMyProjectChats";
import useProjectChat from "@/features/client/hooks/useProjectChat";
import { useProjectChatParticipants } from "@/hooks/useProjectChatParticipants";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Crown, Users as UsersIcon } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import ProjectChatParticipants from "@/components/project/ProjectChatParticipants";
import ERPChatHeader from "@/components/project/ERPChatHeader";
import ERPChatMessage from "@/components/project/ERPChatMessage";
import ERPChatInput from "@/components/project/ERPChatInput";

export default function MisChats() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const { data: chats, isLoading: chatsLoading } = useMyProjectChats();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const { messages, loading: messagesLoading, sending, sendMessage } = useProjectChat(selectedProjectId);
  const { data: participants = [] } = useProjectChatParticipants(selectedProjectId || '');

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  // Auto-select project from URL parameter
  useEffect(() => {
    if (projectIdFromUrl && projectIdFromUrl !== selectedProjectId) {
      setSelectedProjectId(projectIdFromUrl);
    }
  }, [projectIdFromUrl]);

  // Update URL when project selection changes
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSearchParams({ project: projectId });
  };

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

  const getParticipantTypeIcon = (type: string) => {
    if (type === 'sales_advisor') return <Crown className="h-3 w-3 text-amber-500" />;
    if (type === 'client') return null;
    return <UsersIcon className="h-3 w-3 text-muted-foreground" />;
  };

  const groupedMessages = groupMessagesByDate();
  const selectedChat = chats?.find(c => c.project_id === selectedProjectId);

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-lg -z-10" />
        <h1 className="text-3xl font-bold tracking-tight">Mis Chats</h1>
        <p className="text-muted-foreground mt-2">
          Conversaciones de tus proyectos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100%-5rem)]">
        {/* Lista de Chats */}
        <Card className="col-span-1 lg:col-span-3 flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Proyectos</h2>
            <p className="text-sm text-muted-foreground">
              {chats?.length || 0} conversaciones
            </p>
          </div>

          <ScrollArea className="flex-1">
            {chatsLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No tienes chats disponibles</p>
              </div>
            ) : (
              <div>
                {chats?.map((chat) => {
                  const isSelected = selectedProjectId === chat.project_id;
                  const hasUnread = chat.unread_count > 0;
                  
                  return (
                    <button
                      key={chat.project_id}
                      onClick={() => handleProjectSelect(chat.project_id)}
                      className={`
                        w-full p-4 text-left transition-all duration-200
                        border-b border-border/50 last:border-0
                        hover:bg-accent/50
                        ${isSelected ? 'bg-accent/30 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className={`
                            h-10 w-10 transition-all
                            ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                          `}>
                            <AvatarFallback className={`
                              font-semibold text-sm
                              ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
                            `}>
                              {chat.projects.clients.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={`
                              font-semibold text-sm truncate
                              ${isSelected ? 'text-primary' : ''}
                            `}>
                              {chat.projects.clients.name}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {getParticipantTypeIcon(chat.participant_type)}
                              {hasUnread && (
                                <Badge 
                                  variant="default" 
                                  className="h-5 min-w-[20px] px-1.5 animate-pulse bg-primary text-primary-foreground"
                                >
                                  {chat.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {chat.last_message_preview ? (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              <span className="font-medium">{chat.last_message_sender}:</span> {chat.last_message_preview}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic mb-1">
                              Sin mensajes aún
                            </p>
                          )}
                          
                          {chat.last_message_at && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(chat.last_message_at), "dd MMM HH:mm", { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Panel de Chat */}
        <Card className="col-span-1 lg:col-span-6 flex flex-col overflow-hidden">
          {!selectedProjectId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Selecciona un chat para comenzar</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <ERPChatHeader 
                projectName={selectedChat?.projects.clients.name || 'Chat del Proyecto'}
                participants={participants.filter(p => p.profiles) as any}
              />

              {/* Messages Area */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-4">
                {messagesLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
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
                disabled={sending || messagesLoading}
              />
            </>
          )}
        </Card>

        {/* Panel de Participantes */}
        <div className="hidden lg:block lg:col-span-3">
          {selectedProjectId ? (
            <ProjectChatParticipants projectId={selectedProjectId} />
          ) : (
            <Card className="p-4 h-full flex items-center justify-center">
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
