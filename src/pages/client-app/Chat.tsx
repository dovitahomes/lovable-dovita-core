import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Info, MessageSquare } from 'lucide-react';
import { ClientEmptyState } from '@/components/client-app/ClientSkeletons';
import ChatHeader from '@/components/client-app/ChatHeader';
import ChatMessage from '@/components/client-app/ChatMessage';
import ChatInput from '@/components/client-app/ChatInput';
import AvatarCustomizationDialog from '@/components/client-app/AvatarCustomizationDialog';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { useProjectChat } from '@/features/client/hooks';
import { useEventNotifications } from '@/hooks/client-app/useEventNotifications';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Chat() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  
  // Use real backend hook
  const { messages: backendMessages, loading, error, sending, sendMessage: sendBackendMessage } = useProjectChat(currentProject?.id || null);
  
  // Escuchar notificaciones en tiempo real de cambios en citas
  useEventNotifications(currentProject?.id);
  
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clientAvatar, setClientAvatar] = useState<{ type: "preset" | "custom"; value: string } | null>(() => {
    const saved = localStorage.getItem("clientAvatar");
    return saved ? JSON.parse(saved) : null;
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const handleSaveAvatar = (avatar: { type: "preset" | "custom"; value: string }) => {
    setClientAvatar(avatar);
    localStorage.setItem("clientAvatar", JSON.stringify(avatar));
  };

  // Transform backend messages to match Client App format
  const messages = backendMessages.map(msg => ({
    id: parseInt(msg.id.split('-')[0], 16), // Convert UUID to number for compatibility
    projectId: msg.project_id,
    content: msg.message,
    attachments: msg.attachments,
    timestamp: msg.created_at,
    isClient: msg.sender_id === currentUserId,
    status: msg.status,
    sender: msg.sender_id !== currentUserId ? {
      id: msg.sender.id,
      name: msg.sender.full_name || msg.sender.email,
      avatar: msg.sender.avatar_url || '',
      role: 'Equipo' // Generic role for team members
    } : undefined
  }));

  // Smart auto-scroll: only scroll if user is near bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Track if user is scrolled to bottom
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

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    try {
      // TODO: Upload attachments to storage if needed
      const attachmentUrls = attachments?.map(f => ({
        name: f.name,
        url: '', // Will be populated after upload
        size: f.size,
        type: f.type
      })) || [];

      await sendBackendMessage(content, attachmentUrls);
      shouldAutoScrollRef.current = true; // Force scroll on send
      toast.success('Mensaje enviado');
    } catch (err) {
      toast.error('Error al enviar mensaje');
      console.error('Error sending message:', err);
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups: { [key: string]: typeof messages } = {};
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp);
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

  return (
    <div className="flex flex-col h-full pb-[130px]">
      {/* Header - Fixed top */}
      <div className="flex-shrink-0 bg-background border-b">
        <ChatHeader onAvatarCustomize={() => setAvatarDialogOpen(true)} />
      </div>

      {/* Messages Area - Scrollable */}
      <div 
        ref={scrollAreaRef} 
        className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4"
      >
        <div className="py-4">
          {/* Team Members Info */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span>Chat grupal del equipo</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {currentProject?.team.map((member, index) => (
                <span key={member.id} className="text-muted-foreground">
                  {member.name}
                  {index < (currentProject.team.length - 1) && ', '}
                </span>
              ))}
            </div>
          </div>

          {/* Messages grouped by date */}
          {Object.keys(groupedMessages).length === 0 ? (
            <ClientEmptyState
              icon={MessageSquare}
              title="No hay mensajes"
              description="Inicia una conversación con tu equipo enviando un mensaje."
            />
          ) : (
          Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
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
                <ChatMessage key={message.id} message={message} clientAvatar={clientAvatar} />
              ))}
            </div>
          ))
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2 mb-4">
              <img
                src={currentProject?.team[0]?.avatar}
                alt={currentProject?.team[0]?.name}
                className="h-8 w-8 rounded-full flex-shrink-0 mt-1"
              />
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed bottom */}
      <div className="flex-shrink-0 bg-background border-t">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>

      <AvatarCustomizationDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatar={clientAvatar}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
