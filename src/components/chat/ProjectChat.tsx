import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    email: string;
    full_name?: string;
  };
}

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`project_messages:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_messages',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          // Fetch sender info for the new message
          const { data: senderData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', payload.new.sender_id)
            .single();
          
          const newMsg = {
            ...payload.new,
            sender: senderData
          } as Message;
          
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Fetch sender info separately
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', msg.sender_id)
            .single();
          
          return {
            ...msg,
            sender: senderData || undefined
          };
        })
      );
      
      setMessages(messagesWithSenders);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Error al cargar mensajes');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUserId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          sender_id: currentUserId,
          message: newMessage.trim()
        });

      if (error) throw error;
      
      setNewMessage("");
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || '??';
  };

  return (
    <Card className="flex flex-col h-[600px] w-full">
      <CardHeader>
        <CardTitle>Chat del Proyecto</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 gap-4 p-3 md:p-6">
        <ScrollArea ref={scrollRef} className="flex-1 pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No hay mensajes aún. ¡Inicia la conversación!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2 md:gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {getInitials(msg.sender?.full_name, msg.sender?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col gap-1 max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">
                          {msg.sender?.full_name || msg.sender?.email || 'Usuario'}
                        </span>
                        <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 md:px-4 md:py-3 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
