import { useIsMobile } from "@/hooks/use-mobile";
import Documents from "./Documents";
import DocumentsDesktop from "./DocumentsDesktop";

export default function ResponsiveDocuments() {
  const isMobile = useIsMobile();
  return isMobile ? <Documents /> : <DocumentsDesktop />;
}
