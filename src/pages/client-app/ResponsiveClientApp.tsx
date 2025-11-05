import { useIsMobile } from "@/hooks/use-mobile";
import ClientApp from "./ClientApp";
import ClientAppDesktop from "./ClientAppDesktop";

export default function ResponsiveClientApp() {
  const isMobile = useIsMobile();
  
  return isMobile ? <ClientApp /> : <ClientAppDesktop />;
}
