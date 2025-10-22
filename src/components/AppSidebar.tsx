import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, Building2, Handshake, MapPin, Users, ShieldCheck, FileText, LogOut, UserCog, BriefcaseIcon, FolderKanban, TrendingUp, ListTree, Calculator } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Usuarios", url: "/usuarios", icon: UserCog },
  { title: "Clientes", url: "/clientes", icon: BriefcaseIcon },
  { title: "Proyectos", url: "/proyectos", icon: FolderKanban },
  { title: "Leads", url: "/leads", icon: TrendingUp },
  { title: "Presupuestos", url: "/presupuestos", icon: Calculator },
];

const toolsItems = [
  { title: "Contenido Corporativo", url: "/herramientas/contenido-corporativo", icon: Building2 },
  { title: "Sucursales", url: "/herramientas/sucursales", icon: MapPin },
  { title: "Alianzas", url: "/herramientas/alianzas", icon: Handshake },
  { title: "Identidades", url: "/herramientas/identidades", icon: Users },
  { title: "Accesos", url: "/herramientas/accesos", icon: ShieldCheck },
  { title: "Centro de Reglas", url: "/herramientas/reglas", icon: FileText },
  { title: "Catálogo TU", url: "/herramientas/catalogo-tu", icon: ListTree },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        
        setIsAdmin(!!data);
      }
    };
    checkAdminRole();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada");
      navigate("/auth");
    }
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"}>
      <SidebarContent>
        <div className="px-3 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {state !== "collapsed" && (
              <div>
                <h2 className="font-bold text-sidebar-foreground">Dovita</h2>
                <p className="text-xs text-sidebar-foreground/70">CRM/ERP</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Settings className="h-3 w-3 inline mr-1" />
              Herramientas
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          {state !== "collapsed" && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
