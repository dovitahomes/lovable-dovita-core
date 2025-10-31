import { Outlet } from "react-router-dom";
import DovitaHeaderDesktop from "@/components/client-app/DovitaHeaderDesktop";
import FloatingIslandSidebar from "@/components/client-app/FloatingIslandSidebar";

export default function ClientAppDesktop() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DovitaHeaderDesktop />
      <FloatingIslandSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 md:pl-24 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
