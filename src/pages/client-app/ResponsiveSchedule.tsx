import { useIsMobile } from "@/hooks/use-mobile";
import Schedule from "./Schedule";
import ScheduleDesktop from "./ScheduleDesktop";

export default function ResponsiveSchedule() {
  const isMobile = useIsMobile();
  return isMobile ? <Schedule /> : <ScheduleDesktop />;
}
