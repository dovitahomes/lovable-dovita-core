import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useMyProjectChats } from "@/hooks/useMyProjectChats";
import useProjectChat from "@/features/client/hooks/useProjectChat";
import { useProjectChatParticipants } from "@/hooks/useProjectChatParticipants";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Crown, Users as UsersIcon, Send, ArrowDown, ChevronLeft } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import ProjectChatParticipants from "@/components/project/ProjectChatParticipants";
import ERPChatHeader from "@/components/project/ERPChatHeader";
import ERPChatMessage from "@/components/project/ERPChatMessage";
import ERPChatInput from "@/components/project/ERPChatInput";
import { cn } from "@/lib/utils";

export default function MisChats() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('project');
  
  const { data: chats, isLoading: chatsLoading } = useMyProjectChats();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectIdFromUrl || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  
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
    setShowChatOnMobile(true); // Switch to chat view on mobile
  };

  // Back to list on mobile
  const handleBackToList = () => {
    setShowChatOnMobile(false);
  };

  // Smart auto-scroll: only if user is near bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Track scroll position and show/hide scroll button
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      shouldAutoScrollRef.current = isNearBottom;
      setShowScrollButton(!isNearBottom && messages.length > 5);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  // Show scroll button when new messages arrive and user is not at bottom
  useEffect(() => {
    if (messages.length > previousMessageCount && !shouldAutoScrollRef.current) {
      setShowScrollButton(true);
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    shouldAutoScrollRef.current = true;
  };

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
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)]" role="main" aria-label="Mensajes de proyectos">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent rounded-lg -z-10" />
        <h1 className="text-3xl font-bold tracking-tight">Mis Chats</h1>
        <p className="text-muted-foreground mt-2">
          Conversaciones de tus proyectos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100%-5rem)]" role="region" aria-label="Área de chat">
        {/* Lista de Chats */}
        <Card className={cn(
          "col-span-1 lg:col-span-3 flex flex-col overflow-hidden animate-slide-in-right",
          showChatOnMobile && "hidden lg:flex"
        )} role="navigation" aria-label="Lista de proyectos">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Proyectos</h2>
            <p className="text-sm text-muted-foreground">
              {chats?.length || 0} conversaciones
            </p>
          </div>

          <ScrollArea className="flex-1" aria-label="Proyectos con chats">
            {chatsLoading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0 bg-gradient-to-r from-muted via-muted/50 to-muted" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted" />
                      <Skeleton className="h-3 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats?.length === 0 ? (
              <div className="p-12 text-center animate-fade-in">
                <div className="inline-block p-4 rounded-full bg-muted/50 mb-4">
                  <MessageSquare className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No tienes chats disponibles</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Los chats aparecerán aquí cuando seas asignado a un proyecto.
                </p>
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
                        focus-ring
                        ${isSelected ? 'bg-accent/30 border-l-4 border-l-primary animate-slide-in-right' : 'border-l-4 border-l-transparent'}
                      `}
                      aria-label={`Chat del proyecto ${chat.projects.clients.name}`}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className={cn(
                            "h-10 w-10 transition-all",
                            isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                            !isSelected && chat.participant_type === 'sales_advisor' && "ring-2 ring-amber-500/30",
                            !isSelected && chat.participant_type === 'client' && "ring-2 ring-blue-500/30",
                            !isSelected && chat.participant_type === 'collaborator' && "ring-2 ring-purple-500/30"
                          )}>
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
        <Card className={cn(
          "col-span-1 lg:col-span-6 flex flex-col overflow-hidden animate-fade-in",
          !showChatOnMobile && selectedProjectId && "hidden lg:flex"
        )} role="region" aria-label="Área de mensajes">
          {!selectedProjectId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground animate-fade-in">
              <div className="text-center px-4">
                <div className="inline-block p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                  <MessageSquare className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">👋 Selecciona una conversación</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Elige un proyecto de la lista para ver y enviar mensajes al equipo.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header with Back Button on Mobile */}
              <div className="flex items-center gap-2 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToList}
                  className="lg:hidden ml-2 focus-ring"
                  aria-label="Volver a lista de proyectos"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <ERPChatHeader 
                    projectId={selectedProjectId}
                    projectName={selectedChat?.projects.clients.name || 'Chat del Proyecto'}
                    participants={participants.filter(p => p.profiles) as any}
                  />
                </div>
              </div>

              {/* Messages Area */}
              <div className="relative flex-1 overflow-hidden">
                <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-4" aria-live="polite" aria-atomic="false">
                  {messagesLoading ? (
                  <div className="space-y-3 animate-fade-in">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const isSelf = i % 3 === 0;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex animate-pulse",
                            isSelf ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className="max-w-[70%] space-y-1">
                            <Skeleton 
                              className={cn(
                                "h-16 rounded-2xl",
                                isSelf ? "w-48 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-blue-500/20" : "w-56 bg-gradient-to-r from-muted via-muted/50 to-muted"
                              )}
                            />
                            <Skeleton className="h-2 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center animate-fade-in">
                    {/* Team Info Banner */}
                    {participants.length > 0 && (
                      <div className="bg-muted/50 rounded-xl p-4 mb-8 max-w-md w-full">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground mb-3">
                          <UsersIcon className="h-4 w-4 text-primary" />
                          <span>Equipo del proyecto</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 text-xs">
                          {participants.map((participant, index) => (
                            <div key={participant.id} className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">
                                {participant.profiles?.full_name || participant.profiles?.email}
                              </span>
                              {participant.participant_type === 'sales_advisor' && (
                                <Crown className="h-3 w-3 text-amber-500" />
                              )}
                              {index < participants.length - 1 && (
                                <span className="text-muted-foreground/50">•</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    <div className="text-center">
                      <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
                        <Send className="h-12 w-12 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">No hay mensajes aún</h4>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                        Sé el primero en iniciar la conversación con el equipo del proyecto.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                      <div key={dateKey} className="animate-fade-in">
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4" role="separator" aria-label={getDateLabel(dateKey)}>
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

              {/* Scroll to Bottom Button */}
              {showScrollButton && (
                <Button
                  onClick={scrollToBottom}
                  size="icon"
                  className={cn(
                    "absolute bottom-24 right-6 rounded-full shadow-lg z-10",
                    "bg-primary hover:bg-primary-hover text-primary-foreground",
                    "animate-slide-in-up hover:scale-110 transition-transform",
                    "focus-ring"
                  )}
                  aria-label="Desplazarse al final del chat"
                >
                  <ArrowDown className="h-5 w-5" />
                  <span className="sr-only">Nuevos mensajes</span>
                </Button>
              )}
            </div>
          
              {/* Input Area */}
              <ERPChatInput 
                onSendMessage={handleSendMessage}
                disabled={sending || messagesLoading}
              />
            </>
          )}
        </Card>

        {/* Panel de Participantes */}
        <div className={cn(
          "lg:col-span-3 animate-slide-in-right",
          showChatOnMobile ? "hidden lg:block" : "hidden lg:block"
        )} role="complementary" aria-label="Participantes del chat">
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
