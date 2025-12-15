import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, CheckCheck, FileIcon, Pencil, FileText, Image as ImageIcon, File, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarPublicUrl } from '@/lib/storage/avatar-url';

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

  const formatRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: es 
      });
    } catch {
      return formatTime(timestamp);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (type.includes('document') || type.includes('word')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const isImageFile = (type: string) => type.startsWith('image/');

  const renderStatus = () => {
    if (!isOwnMessage) return null;
    
    const statusConfig = {
      read: { 
        icon: <CheckCheck className="h-3.5 w-3.5 text-primary" />,
        tooltip: "Visto"
      },
      delivered: { 
        icon: <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />,
        tooltip: "Entregado"
      },
      sent: { 
        icon: <Check className="h-3.5 w-3.5 text-muted-foreground" />,
        tooltip: "Enviado"
      }
    };

    const config = statusConfig[message.status];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{config.icon}</span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {config.tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={cn(
      "flex gap-2 mb-4",
      isOwnMessage ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
          <AvatarImage src={getAvatarPublicUrl(message.sender.avatar_url)} />
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
          "rounded-2xl px-4 py-2.5 break-words shadow-sm transition-colors",
          isOwnMessage 
            ? "bg-[hsl(var(--primary))] text-white rounded-tr-sm" 
            : "bg-muted text-foreground rounded-tl-sm"
        )}>
          {message.message && (
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
          )}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className={cn("space-y-2", message.message && "mt-3")}>
              {message.attachments.map((att, idx) => {
                const isImage = isImageFile(att.type);
                
                return isImage ? (
                  // Image thumbnail preview
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group relative rounded-lg overflow-hidden transition-all hover:shadow-lg"
                  >
                    <img 
                      src={att.url} 
                      alt={att.name}
                      className="w-full max-w-xs rounded-lg transition-transform group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Download className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </div>
                  </a>
                ) : (
                  // File attachment card
                  <a
                    key={idx}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-all text-xs group",
                      "hover:shadow-md",
                      isOwnMessage 
                        ? "bg-white/20 hover:bg-white/30 text-white" 
                        : "bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      isOwnMessage 
                        ? "bg-white/20" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {getFileIcon(att.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{att.name}</p>
                      <p className={cn(
                        "text-[10px] mt-0.5",
                        isOwnMessage ? "text-white/70" : "text-muted-foreground"
                      )}>
                        {(att.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Download className={cn(
                      "h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      isOwnMessage ? "text-white" : "text-primary"
                    )} />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Metadata: time, status, edited */}
        <div className={cn(
          "flex items-center gap-1.5 mt-1 px-1",
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-muted-foreground cursor-help">
                  {formatRelativeTime(message.created_at)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {format(new Date(message.created_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {message.is_edited && (
            <>
              <span className="text-[10px] text-muted-foreground">•</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 cursor-help">
                      <Pencil className="h-2.5 w-2.5" />
                      Editado
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {message.edited_at && format(new Date(message.edited_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
          {renderStatus()}
        </div>
      </div>
    </div>
  );
}
