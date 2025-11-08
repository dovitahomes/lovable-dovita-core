import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, CheckCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ChatMessageProps {
  id: string;
  content: string;
  timestamp: string;
  isClient: boolean;
  status?: "sent" | "delivered" | "read";
  sender?: {
    name: string;
    avatar: string;
    role: string;
  };
  clientAvatar?: { type: "preset" | "custom"; value: string } | null;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
}

/**
 * Componente ChatMessage memoizado para evitar re-renders innecesarios
 */
const ChatMessage = memo(function ChatMessage({
  content,
  timestamp,
  isClient,
  status,
  sender,
  clientAvatar,
  attachments,
}: ChatMessageProps) {
  const getAvatarContent = () => {
    if (!clientAvatar) {
      return <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Default" />;
    }
    return <AvatarImage src={clientAvatar.value} />;
  };

  const getStatusIcon = () => {
    if (!status || !isClient) return null;
    
    if (status === "read") {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    if (status === "delivered") {
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    }
    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  const formatTime = (isoString: string) => {
    try {
      return format(parseISO(isoString), "HH:mm", { locale: es });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] ${isClient ? "order-2" : "order-1"}`}>
        {!isClient && sender && (
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={sender.avatar} />
              <AvatarFallback>{sender.name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{sender.name}</span>
          </div>
        )}
        {isClient && (
          <div className="flex items-center gap-2 mb-1 justify-end">
            <span className="text-xs text-muted-foreground">Tú</span>
            <Avatar className="h-6 w-6">
              {getAvatarContent()}
            </Avatar>
          </div>
        )}
        
        <div
          className={`rounded-2xl px-4 py-2 ${
            isClient
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{content}</p>
          
          {attachments && attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 rounded bg-background/10 text-xs"
                >
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-xs opacity-70">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-muted-foreground">
            {formatTime(timestamp)}
          </span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
