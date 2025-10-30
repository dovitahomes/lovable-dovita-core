import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import dovitaIcon from "@/assets/dovita-icon.png";
import dovitaIconWhite from "@/assets/dovita-icon-white.png";
import dovitaLogoDark from "@/assets/dovita-logo-dark.png";
import dovitaLogoWhite from "@/assets/dovita-logo-white.png";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
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
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/context/ThemeProvider";
import { useSidebarTheme } from "@/context/SidebarThemeProvider";
import { ALL_ROUTES } from "@/lib/routing/getAccessibleRoutes";

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { sidebarTheme, toggleSidebarTheme } = useSidebarTheme();
  const { prefetch } = usePrefetchRoute();

  // TODO: Filter by permissions once seeded in Prompt 2
  // const { canView } = useModuleAccess();
  // const routesToShow = ALL_ROUTES.map(group => ({
  //   ...group,
  //   items: group.items.filter(item => 
  //     item.moduleName ? canView(item.moduleName) : true
  //   )
  // })).filter(group => group.items.length > 0);
  
  const routesToShow = ALL_ROUTES;

  const handleLogout = async () => {
    const { appSignOut } = await import('@/lib/auth/logout');
    appSignOut();
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar 
      className={state === "collapsed" ? "w-14 xl:w-16" : "w-64"} 
      data-sidebar-theme={sidebarTheme}
    >
      <SidebarHeader className="flex items-center justify-center py-6 px-4">
        <img 
          src={
            state === "collapsed" 
              ? (sidebarTheme === "dark" ? dovitaIconWhite : dovitaIcon)
              : (sidebarTheme === "dark" ? dovitaLogoWhite : dovitaLogoDark)
          }
          alt="Dovita"
          className="object-contain max-w-full h-auto"
          style={{ maxHeight: state === "collapsed" ? "24px" : "40px" }}
        />
      </SidebarHeader>
      
      <SidebarContent>

        {routesToShow.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={getNavClass}
                        onMouseEnter={() => {
                          if (item.url === "/proveedores") {
                            prefetch({
                              queryKey: ["providers"],
                              queryFn: async () => {
                                const { data } = await supabase.from("providers").select("*").order("name");
                                return data;
                              },
                            });
                          }
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        <Button
          variant="ghost"
          onClick={toggleSidebarTheme}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          title={sidebarTheme === "dark" ? "Sidebar Claro" : "Sidebar Oscuro"}
        >
          {sidebarTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {state !== "collapsed" && <span className="ml-2 truncate">{sidebarTheme === "dark" ? "Sidebar Claro" : "Sidebar Oscuro"}</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          title="Cerrar Sesión"
        >
          <LogOut className="h-4 w-4" />
          {state !== "collapsed" && <span className="ml-2 truncate">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
