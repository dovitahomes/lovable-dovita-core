import { useIsMobile } from '@/hooks/use-mobile';
import Settings from './Settings';
import SettingsDesktop from './SettingsDesktop';

export default function ResponsiveSettings() {
  const isMobile = useIsMobile();
  
  return isMobile ? <Settings /> : <SettingsDesktop />;
}
