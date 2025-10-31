import { useIsMobile } from "@/hooks/use-mobile";
import Appointments from "./Appointments";
import AppointmentsDesktop from "./AppointmentsDesktop";

export default function ResponsiveAppointments() {
  const isMobile = useIsMobile();
  return isMobile ? <Appointments /> : <AppointmentsDesktop />;
}
