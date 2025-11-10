import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, FileIcon, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ERPChatMessageProps {
  message: {
    id: string;
    sender_id: string;
    message: string;
    attachments: Array<{ name: string; url: string; size: number; type: string }>;
    status: 'sent' | 'delivered' | 'read';
    is_edited: boolean;
    edited_at: string | null;
    created_at: string;
    sender: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
  };
  currentUserId: string | null;
}

export default function ERPChatMessage({ message, currentUserId }: ERPChatMessageProps) {
  const isOwnMessage = message.sender_id === currentUserId;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: es });
  };

  const renderStatus = () => {
    if (!isOwnMessage) return null;
    
    if (message.status === 'read') {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else if (message.status === 'delivered') {
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    } else {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn(
      "flex gap-2 mb-4",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={message.sender.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(message.sender.full_name || message.sender.email)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {/* Sender name (only for others' messages) */}
        {!isOwnMessage && (
          <span className="text-xs text-muted-foreground mb-1 px-1">
            {message.sender.full_name || message.sender.email}
          </span>
        )}

        {/* Message content */}
        <div className={cn(
          "rounded-2xl px-4 py-2.5 break-words",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted text-foreground rounded-tl-sm"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-colors text-xs",
                    isOwnMessage 
                      ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" 
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <FileIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate flex-1">{att.name}</span>
                  <span className="text-[10px] opacity-70">
                    {(att.size / 1024).toFixed(1)} KB
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Metadata: time, status, edited */}
        <div className={cn(
          "flex items-center gap-1 mt-1 px-1",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          {message.is_edited && (
            <>
              <span className="text-[10px] text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Pencil className="h-2.5 w-2.5" />
                Editado
              </span>
            </>
          )}
          {renderStatus()}
        </div>
      </div>
    </div>
  );
}
