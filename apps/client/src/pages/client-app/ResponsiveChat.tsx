import { useIsMobile } from "@/hooks/use-mobile";
import Chat from "./Chat";
import ChatDesktop from "./ChatDesktop";

export default function ResponsiveChat() {
  const isMobile = useIsMobile();
  return isMobile ? <Chat /> : <ChatDesktop />;
}
