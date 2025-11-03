import Logo from '@/components/Logo';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DovitaHeader() {
  return (
    <header className="bg-primary text-white px-6 flex items-center justify-between border-b border-primary/20 fixed top-0 left-0 right-0 z-50 no-zoom flex-shrink-0 h-14" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
      <Logo size="small" className="brightness-0 invert" />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-secondary text-primary text-[10px]">
            3
          </Badge>
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
