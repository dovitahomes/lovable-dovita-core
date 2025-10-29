import { useState, useRef, useEffect } from "react";
import { useClientProjects, useProjectChat } from "@/features/client/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Chat() {
  const { 
    projects, 
    loading: projectsLoading, 
    selectedProjectId, 
    setSelectedProjectId 
  } = useClientProjects();
  
  const { 
    messages, 
    loading: messagesLoading, 
    error, 
    sending, 
    sendMessage,
    refetch 
  } = useProjectChat(selectedProjectId);
  
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error("Hubo un problema al cargar el chat", {
        action: {
          label: "Reintentar",
          onClick: () => refetch(),
        },
      });
    }
  }, [error, refetch]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    try {
      await sendMessage(inputText);
      setInputText("");
    } catch (err) {
      toast.error("No se pudo enviar el mensaje");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (projectsLoading) {
    return (
      <div className="space-y-4 pb-20">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center px-4 pb-20">
        <MessageSquare className="h-16 w-16 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">No tienes proyectos</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Aún no tienes proyectos asignados. Contacta con tu equipo para más información.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] pb-20">
      {/* Header with project selector */}
      <div className="flex-shrink-0 space-y-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Chat del proyecto</h1>
          <p className="text-sm text-muted-foreground">Comunícate con tu equipo</p>
        </div>

        {projects.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Proyecto</label>
            <Select
              value={selectedProjectId || undefined}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    Proyecto {format(parseISO(project.created_at), "dd/MM/yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messagesLoading && !messages.length ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}>
                <Skeleton className="h-16 w-3/4 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-4">
            <MessageSquare className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-base font-medium text-foreground">No hay mensajes</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Inicia la conversación con tu equipo enviando un mensaje.
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {format(parseISO(msg.created_at), "HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      {selectedProjectId && (
        <div className="flex-shrink-0 pt-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
