import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, CheckCheck, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ChatMessageProps {
  message: {
    id: number;
    content: string;
    timestamp: string;
    isClient: boolean;
    sender?: {
      name: string;
      avatar: string;
      role: string;
    };
    status?: 'sent' | 'delivered' | 'read';
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  };
  clientAvatar?: { type: "preset" | "custom"; value: string } | null;
}

export default function ChatMessage({ message, clientAvatar }: ChatMessageProps) {
  const messageDate = new Date(message.timestamp);
  const timeString = format(messageDate, 'HH:mm', { locale: es });

  const getAvatarContent = () => {
    if (!clientAvatar) {
      return <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Default" />;
    }
    
    return <AvatarImage src={clientAvatar.value} />;
  };


  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  if (message.isClient) {
    // Client message (right side, blue)
    return (
      <div className="flex justify-end mb-4 gap-2">
        <div className="max-w-[75%]">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className="text-xs text-muted-foreground">Tú</span>
            <Avatar className="h-6 w-6">
              {getAvatarContent()}
            </Avatar>
          </div>
          
          {/* Message Content */}
          {message.content && (
            <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, index) => (
                <Card key={index} className="p-2 flex items-center gap-2 bg-primary/10">
                  <div className="flex-shrink-0">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(attachment.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Download className="h-3 w-3" />
                  </Button>
                </Card>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-end gap-1 mt-1 px-2">
            <span className="text-xs text-muted-foreground">{timeString}</span>
            {message.status === 'read' ? (
              <CheckCheck className="h-3 w-3 text-primary" />
            ) : message.status === 'delivered' ? (
              <CheckCheck className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Check className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Team member message (left side, gray)
  return (
    <div className="flex gap-2 mb-4">
      <img
        src={message.sender?.avatar}
        alt={message.sender?.name}
        className="h-8 w-8 rounded-full flex-shrink-0 mt-1"
      />
      <div className="flex-1 max-w-[75%]">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold text-primary">
            {message.sender?.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {message.sender?.role}
          </span>
        </div>
        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap break-words text-foreground">
            {message.content}
          </p>
        </div>
        
        {/* Attachments for team messages */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <Card key={index} className="p-2 flex items-center gap-2">
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Download className="h-3 w-3" />
                </Button>
              </Card>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-1 mt-1 px-2">
          <span className="text-xs text-muted-foreground">{timeString}</span>
        </div>
      </div>
    </div>
  );
}
