import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun, Building2 } from "lucide-react";
import { usePrefetchRoute } from "@/hooks/usePrefetchRoute";
import { ViewAsClientDialog } from "@/components/ViewAsClientDialog";
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
import { useTheme } from "@/context/ThemeProvider";
import { useUserRole } from "@/hooks/useUserRole";
import { useStablePermissions } from "@/hooks/useStablePermissions";
import { getAccessibleRoutes, MINIMAL_ROUTES } from "@/lib/routing/getAccessibleRoutes";
import { useCorporateContent } from "@/hooks/useCorporateContent";

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { theme, toggle: toggleTheme } = useTheme();
  const { prefetch } = usePrefetchRoute();
  const { role, loading: roleLoading } = useUserRole();
  const { permissions, viewable, loading: permsLoading, error } = useStablePermissions();
  const { data: corporate } = useCorporateContent();

  const isAdmin = role === 'admin';
  const roles = role ? [role] : [];
  
  // Get accessible routes — keeps last valid permissions during refetch
  const accessibleRoutes = getAccessibleRoutes(permissions, roles);
  
  // While loading with no cached permissions, show minimal routes
  const routesToShow = permsLoading && accessibleRoutes.length === 0 ? MINIMAL_ROUTES : accessibleRoutes;
  
  // Empty state only if finished loading and still no routes
  const showEmptyState = !permsLoading && !roleLoading && routesToShow.length === 0 && !isAdmin;

  const handleLogout = async () => {
    const { appSignOut } = await import('@/lib/auth/logout');
    appSignOut(); // No await - let it run and force redirect
  };

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";

  return (
    <Sidebar className={state === "collapsed" ? "w-14 xl:w-16" : "w-64"}>
      <SidebarContent>
        <div className="px-3 py-4">
          <div className="flex items-center gap-3 mb-2">
            {corporate?.isotipo_url ? (
              <img 
                src={corporate.isotipo_url} 
                alt={corporate.nombre_empresa}
                className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            {state !== "collapsed" && (
              <div className="min-w-0">
                <h2 className="font-bold text-sidebar-foreground truncate">
                  {corporate?.nombre_empresa || 'Dovita'}
                </h2>
                <p className="text-xs text-sidebar-foreground/70">CRM/ERP</p>
              </div>
            )}
          </div>
        </div>

        {permsLoading && routesToShow.length === 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Cargando módulos…</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-2">
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
                <div className="h-8 bg-muted rounded animate-pulse" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showEmptyState && (
          <SidebarGroup>
            <SidebarGroupLabel>Sin permisos</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 space-y-2">
                <p className="text-xs text-muted-foreground">
                  No cuentas con permisos para módulos.
                </p>
                <p className="text-xs text-muted-foreground">
                  Contacta a un administrador.
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {routesToShow.length > 0 && routesToShow.map((group) => (
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
        
        {error && permissions.length > 0 && state !== "collapsed" && (
          <div className="px-4 py-2 text-xs text-muted-foreground">
            Mostrando última versión conocida
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {isAdmin && state !== "collapsed" && (
          <div className="mb-2">
            <ViewAsClientDialog />
          </div>
        )}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {state !== "collapsed" && <span className="ml-2 truncate">{theme === "dark" ? "Modo Claro" : "Modo Oscuro"}</span>}
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
