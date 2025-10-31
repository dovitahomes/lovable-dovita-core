import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, Video, MoreVertical } from "lucide-react";
import { mockChatMessages, mockProjectData } from "@/lib/client-data";

interface Message {
  id: number;
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
  const [messages, setMessages] = useState<Message[]>(
    mockChatMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      timestamp: new Date(msg.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      isClient: msg.isClient,
      sender: msg.sender,
      status: msg.status
    }))
  );
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      isClient: true,
      status: "sent",
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  return (
    <div className="h-[calc(100vh-180px)] grid grid-cols-12 gap-6">
      <Card className="col-span-8 flex flex-col">
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={mockProjectData.team[0].avatar} />
              <AvatarFallback>{mockProjectData.team[0].name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{mockProjectData.team[0].name}</h3>
              <p className="text-xs text-muted-foreground">{mockProjectData.team[0].role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="col-span-4 p-6">
        <h3 className="font-semibold mb-4">Información del Proyecto</h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Equipo</h4>
            <div className="space-y-3">
              {mockProjectData.team.map((member) => (
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
                <span className="font-bold">{mockProjectData.progress}%</span>
              </div>
              <Badge className="w-full justify-center">{mockProjectData.currentPhase}</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
