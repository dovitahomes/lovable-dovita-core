import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Info } from 'lucide-react';
import ChatHeader from '@/components/client-app/ChatHeader';
import ChatMessage from '@/components/client-app/ChatMessage';
import ChatInput from '@/components/client-app/ChatInput';
import AvatarCustomizationDialog from '@/components/client-app/AvatarCustomizationDialog';
import { mockChatMessages, mockProjectData } from '@/lib/client-data';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Chat() {
  const [messages, setMessages] = useState(mockChatMessages);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [clientAvatar, setClientAvatar] = useState<{ type: "preset" | "custom"; value: string } | null>(() => {
    const saved = localStorage.getItem("clientAvatar");
    return saved ? JSON.parse(saved) : null;
  });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSaveAvatar = (avatar: { type: "preset" | "custom"; value: string }) => {
    setClientAvatar(avatar);
    localStorage.setItem("clientAvatar", JSON.stringify(avatar));
  };

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: messages.length + 1,
      content,
      timestamp: new Date().toISOString(),
      isClient: true,
      status: 'sent' as const
    } as any;

    setMessages([...messages, newMessage]);
    
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

    // Simulate read receipt
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'read' as const }
            : msg
        )
      );
    }, 2000);

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
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16)-56px)]">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-background border-b">
        <ChatHeader onAvatarCustomize={() => setAvatarDialogOpen(true)} />
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="pt-4">
          {/* Team Members Info */}
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span>Chat grupal del equipo</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {mockProjectData.team.map((member, index) => (
                <span key={member.id} className="text-muted-foreground">
                  {member.name}
                  {index < mockProjectData.team.length - 1 && ', '}
                </span>
              ))}
            </div>
          </div>

          {/* Messages grouped by date */}
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
                <ChatMessage key={message.id} message={message} clientAvatar={clientAvatar} />
              ))}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed */}
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
