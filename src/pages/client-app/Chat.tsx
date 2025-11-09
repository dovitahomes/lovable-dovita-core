import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Info, MessageSquare } from 'lucide-react';
import { ClientEmptyState } from '@/components/client-app/ClientSkeletons';
import ChatHeader from '@/components/client-app/ChatHeader';
import ChatMessage from '@/components/client-app/ChatMessage';
import ChatInput from '@/components/client-app/ChatInput';
import AvatarCustomizationDialog from '@/components/client-app/AvatarCustomizationDialog';
import { mockChatMessages } from '@/lib/client-app/client-data';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Chat() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const [messages, setMessages] = useState(() => 
    mockChatMessages.filter(msg => msg.projectId === currentProject?.id)
  );
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clientAvatar, setClientAvatar] = useState<{ type: "preset" | "custom"; value: string } | null>(() => {
    const saved = localStorage.getItem("clientAvatar");
    return saved ? JSON.parse(saved) : null;
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const handleSaveAvatar = (avatar: { type: "preset" | "custom"; value: string }) => {
    setClientAvatar(avatar);
    localStorage.setItem("clientAvatar", JSON.stringify(avatar));
  };


  // Update messages when project changes
  useEffect(() => {
    setMessages(mockChatMessages.filter(msg => msg.projectId === currentProject?.id));
  }, [currentProject?.id]);

  // Smart auto-scroll: only scroll if user is near bottom
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
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

  const handleSendMessage = (content: string, attachments?: File[]) => {
    const newMessage = {
      id: messages.length + 1,
      projectId: currentProject?.id || '',
      content,
      attachments: attachments?.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date().toISOString(),
      isClient: true,
      status: 'sent' as const
    } as any;

    setMessages([...messages, newMessage]);
    shouldAutoScrollRef.current = true; // Force scroll on send
    
    // Simulate typing indicator
    setTimeout(() => {
      setIsTyping(true);
    }, 500);

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 1000);

    // Simulate team response with typing
    setTimeout(() => {
      setIsTyping(false);
      const teamResponse = {
        id: messages.length + 2,
        projectId: currentProject?.id || '',
        content: '¡Mensaje recibido! Nos pondremos en contacto contigo pronto.',
        timestamp: new Date().toISOString(),
        isClient: false,
        sender: currentProject?.team[0]
      } as any;
      
      setMessages(prev => [...prev, teamResponse]);
      
      // Mark original message as read
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'read' as const }
              : msg
          )
        );
      }, 1000);
    }, 2500);

    toast.success('Mensaje enviado');
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
