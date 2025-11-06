import { useIsMobile } from "@/hooks/use-mobile";
import Photos from "./Photos";
import PhotosDesktop from "./PhotosDesktop";

export default function ResponsivePhotos() {
  const isMobile = useIsMobile();
  return isMobile ? <Photos /> : <PhotosDesktop />;
}
