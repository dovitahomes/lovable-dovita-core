import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { useRef, useEffect } from "react";
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
import { SIDEBAR_SECTIONS } from "@/config/sidebar";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { sidebarTheme, toggleSidebarTheme } = useSidebarTheme();
  const { prefetch } = usePrefetchRoute();
  const isMobile = useIsMobile();
  
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (isMobile) return; // No hover en móvil
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return; // No hover en móvil
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const { canView, loading: permsLoading, isAdminFallback } = useModuleAccess();
  
  // Log sidebar filtering for debugging
  console.log('[AppSidebar] Filtering routes, total sections:', SIDEBAR_SECTIONS.length, 'permsLoading:', permsLoading, 'isAdminFallback:', isAdminFallback);
  
  // Si está cargando, mostrar todas las secciones con skeleton
  // Si es admin fallback y no hay permisos, mostrar todo
  // Si no, filtrar por permisos
  const routesToShow = permsLoading
    ? SIDEBAR_SECTIONS // Mostrar estructura mientras carga
    : SIDEBAR_SECTIONS.map(section => {
        const filteredItems = section.items.filter(item => {
          const can = canView(item.moduleName);
          console.log('[AppSidebar] Module:', item.moduleName, 'canView:', can, 'isAdminFallback:', isAdminFallback);
          return can;
        });
        return {
          ...section,
          items: filteredItems
        };
      }).filter(section => section.items.length > 0);
  
  console.log('[AppSidebar] Routes to show:', routesToShow.length, 'sections');

  const handleLogout = async () => {
    const { appSignOut } = await import('@/lib/auth/logout');
    appSignOut();
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = isActive ? "font-medium" : "";
    const colorClasses = sidebarTheme === "light"
      ? isActive 
        ? "bg-blue-50 text-blue-600" 
        : "hover:bg-gray-100 text-gray-700"
      : isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";
    return `${baseClasses} ${colorClasses}`;
  };

  return (
    <Sidebar 
      className={
        state === "collapsed" 
          ? (sidebarTheme === "light" ? "w-14 xl:w-16 bg-white border-r" : "w-14 xl:w-16")
          : (sidebarTheme === "light" ? "w-64 bg-white border-r" : "w-64")
      }
      data-sidebar-theme={sidebarTheme}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      collapsible="icon"
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
        {permsLoading ? (
          // Skeleton mientras carga
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-8 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          routesToShow.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className={sidebarTheme === "light" ? "text-gray-600" : ""}>
                {group.label}
              </SidebarGroupLabel>
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
                          <item.icon className={sidebarTheme === "light" ? "h-4 w-4 text-blue-600" : "h-4 w-4"} />
                          {(isMobile || state !== "collapsed") && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <SidebarFooter className={sidebarTheme === "light" ? "border-t border-gray-200" : ""}>
        <SidebarGroup>
          <SidebarGroupLabel className={sidebarTheme === "light" ? "text-gray-600" : ""}>
            Sesión
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggleSidebarTheme} asChild>
                  <div className={
                    sidebarTheme === "light"
                      ? "cursor-pointer text-gray-700 hover:bg-gray-100"
                      : "cursor-pointer hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }>
                    {sidebarTheme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className={sidebarTheme === "light" ? "h-4 w-4 text-blue-600" : "h-4 w-4"} />
                    )}
                    {(isMobile || state !== "collapsed") && <span>Sidebar {sidebarTheme === "dark" ? "Claro" : "Oscuro"}</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} asChild>
                  <div className={
                    sidebarTheme === "light"
                      ? "cursor-pointer text-gray-700 hover:bg-gray-100"
                      : "cursor-pointer hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }>
                    <LogOut className={sidebarTheme === "light" ? "h-4 w-4 text-blue-600" : "h-4 w-4"} />
                    {(isMobile || state !== "collapsed") && <span>Cerrar Sesión</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
