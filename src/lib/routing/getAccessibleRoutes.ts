import { 
  LayoutDashboard, 
  TrendingUp, 
  BriefcaseIcon, 
  FolderKanban, 
  PenTool,
  Calculator, 
  Calendar, 
  Truck, 
  DollarSign, 
  Receipt, 
  Percent, 
  UserCog,
  Settings,
  Building2,
  MapPin,
  Handshake,
  Users,
  ShieldCheck,
  FileText,
  ListTree
} from "lucide-react";
import type { ModulePermission } from "@/hooks/useUserPermissions";
import type { UserRole } from "@/hooks/useUserRole";

export type RouteItem = {
  title: string;
  url: string;
  icon: any;
  moduleName?: string;
};

export type RouteGroup = {
  label: string;
  items: RouteItem[];
};

const ALL_ROUTES: RouteGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, moduleName: "dashboard" },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Leads", url: "/leads", icon: TrendingUp, moduleName: "leads" },
      { title: "Clientes", url: "/clientes", icon: BriefcaseIcon, moduleName: "clientes" },
    ],
  },
  {
    label: "Proyectos",
    items: [
      { title: "Proyectos", url: "/proyectos", icon: FolderKanban, moduleName: "proyectos" },
      { title: "Diseño", url: "/diseno", icon: PenTool, moduleName: "diseno" },
      { title: "Presupuestos", url: "/presupuestos", icon: Calculator, moduleName: "presupuestos" },
      { title: "Cronograma", url: "/cronograma", icon: Calendar, moduleName: "cronograma" },
      { title: "Construcción", url: "/construccion", icon: Truck, moduleName: "construccion" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { title: "Finanzas", url: "/finanzas", icon: DollarSign, moduleName: "finanzas" },
      { title: "Contabilidad", url: "/contabilidad", icon: Receipt, moduleName: "contabilidad" },
      { title: "Comisiones", url: "/comisiones", icon: Percent, moduleName: "comisiones" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { title: "Proveedores", url: "/proveedores", icon: Truck, moduleName: "proveedores" },
      { title: "Usuarios", url: "/usuarios", icon: UserCog, moduleName: "usuarios" },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { title: "Métricas", url: "/metrics", icon: TrendingUp, moduleName: "herramientas" },
      { title: "Contenido Corporativo", url: "/herramientas/contenido-corporativo", icon: Building2, moduleName: "herramientas" },
      { title: "Sucursales", url: "/herramientas/sucursales", icon: MapPin, moduleName: "herramientas" },
      { title: "Alianzas", url: "/herramientas/alianzas", icon: Handshake, moduleName: "herramientas" },
      { title: "Identidades", url: "/herramientas/identidades", icon: Users, moduleName: "herramientas" },
      { title: "Accesos", url: "/herramientas/accesos", icon: ShieldCheck, moduleName: "herramientas" },
      { title: "Centro de Reglas", url: "/herramientas/reglas", icon: FileText, moduleName: "herramientas" },
      { title: "Catálogo TU", url: "/herramientas/catalogo-tu", icon: ListTree, moduleName: "herramientas" },
    ],
  },
];

// Rutas mínimas (fallback cuando no hay permisos pero hay sesión)
export const MINIMAL_ROUTES: RouteGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, moduleName: "dashboard" },
    ],
  },
];

/**
 * Filtra las rutas accesibles según los permisos del usuario.
 * Solo muestra rutas donde el usuario tiene permiso de visualización.
 */
export function getAccessibleRoutes(
  permissions: ModulePermission[] = [],
  roles: UserRole[] = []
): RouteGroup[] {
  // Admin siempre ve todo
  const isAdmin = roles.includes('admin');
  if (isAdmin) {
    return ALL_ROUTES;
  }

  // Clientes solo ven su portal (no rutas internas)
  if (roles.includes('cliente') && !roles.some(r => ['admin', 'colaborador', 'contador'].includes(r))) {
    return [];
  }

  // Si no hay permisos todavía, mostrar solo dashboard (no bloquear)
  if (!permissions.length) {
    console.info('[getAccessibleRoutes] No permissions yet, showing minimal routes');
    return MINIMAL_ROUTES;
  }

  // Crear set de claves de módulos permitidos
  const allowedKeys = new Set(
    permissions.filter(p => p.can_view).map(p => p.module_name)
  );

  // Filtrar según permisos
  const filtered = ALL_ROUTES.map(group => ({
    ...group,
    items: group.items.filter(item => {
      // Si no tiene moduleName asociado, mostrar siempre (rutas públicas internas)
      if (!item.moduleName) return true;

      // Verificar si tiene permiso
      return allowedKeys.has(item.moduleName);
    }),
  })).filter(group => group.items.length > 0); // Eliminar grupos vacíos

  // Si después de filtrar no quedó nada, retornar mínimas
  return filtered.length > 0 ? filtered : MINIMAL_ROUTES;
}
