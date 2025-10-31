import { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Users, Info } from 'lucide-react';
import ChatHeader from '@/components/client-app/ChatHeader';
import ChatMessage from '@/components/client-app/ChatMessage';
import ChatInput from '@/components/client-app/ChatInput';
import { mockChatMessages, mockProjectData } from '@/lib/client-data';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Chat() {
  const [messages, setMessages] = useState(mockChatMessages);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full -mb-40">
      {/* Header */}
      <ChatHeader />

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-1">
        <div className="py-1">
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
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
