import { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="mobile-frame w-full max-w-[428px] min-h-[896px] bg-background shadow-2xl">
        {children}
      </div>
    </div>
  );
}
