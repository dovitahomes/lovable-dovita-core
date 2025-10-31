import { useIsMobile } from "@/hooks/use-mobile";
import Financial from "./Financial";
import FinancialDesktop from "./FinancialDesktop";

export default function ResponsiveFinancial() {
  const isMobile = useIsMobile();
  return isMobile ? <Financial /> : <FinancialDesktop />;
}
