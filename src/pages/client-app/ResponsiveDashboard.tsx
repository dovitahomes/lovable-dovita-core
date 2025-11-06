import { useIsMobile } from "@/hooks/use-mobile";
import Dashboard from "./Dashboard";
import DashboardDesktop from "./DashboardDesktop";

export default function ResponsiveDashboard() {
  const isMobile = useIsMobile();
  return isMobile ? <Dashboard /> : <DashboardDesktop />;
}
