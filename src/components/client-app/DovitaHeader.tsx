import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProjectSelector from './ProjectSelector';

export default function DovitaHeader() {
  return (
    <header className="bg-primary text-white fixed top-0 left-0 right-0 z-50 flex-shrink-0 border-b border-primary/20 pt-[env(safe-area-inset-top)]">
      <div className="h-[68px] px-6 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <ProjectSelector variant="mobile" />
        </div>
        <div className="flex items-center gap-2 ml-4">
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
      </div>
    </header>
  );
}
