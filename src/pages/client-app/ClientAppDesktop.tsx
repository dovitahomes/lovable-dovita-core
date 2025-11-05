import { Outlet } from "react-router-dom";
import DovitaHeaderDesktop from "@/components/client-app/DovitaHeaderDesktop";
import FloatingIslandSidebar from "@/components/client-app/FloatingIslandSidebar";

export default function ClientAppDesktop() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DovitaHeaderDesktop />
      <FloatingIslandSidebar />
      
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 md:pl-20 py-3 h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
