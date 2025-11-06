import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, Video, MoreVertical } from "lucide-react";
import { mockChatMessages } from "@/lib/client-app/client-data";
import { useProject } from "@/contexts/client-app/ProjectContext";
import { useDataSource } from "@/contexts/client-app/DataSourceContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AvatarCustomizationDialog from "@/components/client-app/AvatarCustomizationDialog";

interface Message {
  id: number;
  projectId: string;
  content: string;
  timestamp: string;
  isClient: boolean;
  sender?: {
    name: string;
    avatar: string;
    role: string;
  };
  status?: string;
}

export default function ChatDesktop() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const [messages, setMessages] = useState<Message[]>(() =>
    mockChatMessages.filter(msg => msg.projectId === currentProject?.id)
  );
  const [input, setInput] = useState("");
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [clientAvatar, setClientAvatar] = useState<{ type: "preset" | "custom"; value: string } | null>(() => {
    const saved = localStorage.getItem("clientAvatar");
    return saved ? JSON.parse(saved) : null;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSaveAvatar = (avatar: { type: "preset" | "custom"; value: string }) => {
    setClientAvatar(avatar);
    localStorage.setItem("clientAvatar", JSON.stringify(avatar));
  };

  const getAvatarContent = () => {
    if (!clientAvatar) {
      return <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Default" />;
    }
    
    if (clientAvatar.type === "preset") {
      return <AvatarImage src={clientAvatar.value} />;
    }
    
    return <AvatarImage src={clientAvatar.value} />;
  };

  // Update messages when project changes
  useEffect(() => {
    setMessages(mockChatMessages.filter(msg => msg.projectId === currentProject?.id));
  }, [currentProject?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      projectId: currentProject?.id || '',
      content: input,
      timestamp: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      isClient: true,
      status: "sent",
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-100px)] grid grid-cols-12 gap-6">
      <Card className="col-span-8 flex flex-col overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={currentProject?.team[0]?.avatar} />
              <AvatarFallback>{currentProject?.team[0]?.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{currentProject?.team[0]?.name}</h3>
              <p className="text-xs text-muted-foreground">{currentProject?.team[0]?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAvatarDialogOpen(true)}>
                  Personalizar mi avatar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const isClient = message.isClient;
            return (
              <div key={message.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] ${isClient ? "order-2" : "order-1"}`}>
                  {!isClient && message.sender && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{message.sender.name}</span>
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
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-2">
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    {isClient && message.status && (
                      <span className="text-xs text-muted-foreground capitalize">{message.status}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="col-span-4 p-6 overflow-y-auto">
        <h3 className="font-semibold mb-4">Información del Proyecto</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Equipo</h4>
            <div className="space-y-3">
              {currentProject?.team.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    En línea
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Progreso</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Avance general</span>
                <span className="font-bold">{currentProject?.progress}%</span>
              </div>
              <Badge className="w-full justify-center">{currentProject?.currentPhase}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <AvatarCustomizationDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatar={clientAvatar}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
