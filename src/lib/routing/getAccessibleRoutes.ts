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
  Building2,
  MapPin,
  Handshake,
  Users,
  ShieldCheck,
  FileText,
  ListTree
} from "lucide-react";

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

export const ALL_ROUTES: RouteGroup[] = [
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
    label: "Operaciones",
    items: [
      { title: "Proveedores", url: "/proveedores", icon: Truck, moduleName: "proveedores" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Finanzas", url: "/finanzas", icon: DollarSign, moduleName: "finanzas" },
      { title: "Contabilidad", url: "/contabilidad", icon: Receipt, moduleName: "contabilidad" },
      { title: "Comisiones", url: "/comisiones", icon: Percent, moduleName: "comisiones" },
    ],
  },
  {
    label: "ERP",
    items: [
      { title: "Transacciones Unificadas", url: "/erp/transactions", icon: ListTree, moduleName: "herramientas" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Usuarios", url: "/usuarios", icon: UserCog, moduleName: "usuarios" },
      { title: "Métricas", url: "/metrics", icon: TrendingUp, moduleName: "herramientas" },
      { title: "Contenido Corporativo", url: "/herramientas/contenido-corporativo", icon: Building2, moduleName: "herramientas" },
      { title: "Sucursales", url: "/herramientas/sucursales", icon: MapPin, moduleName: "herramientas" },
      { title: "Alianzas", url: "/herramientas/alianzas", icon: Handshake, moduleName: "herramientas" },
      { title: "Identidades", url: "/herramientas/identidades", icon: Users, moduleName: "herramientas" },
      { title: "Accesos", url: "/herramientas/accesos", icon: ShieldCheck, moduleName: "herramientas" },
      { title: "Centro de Reglas", url: "/herramientas/reglas", icon: FileText, moduleName: "herramientas" },
    ],
  },
];

export const MINIMAL_ROUTES: RouteGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard, moduleName: "dashboard" },
    ],
  },
];

// Temporarily simplified - will be restored in Prompt 2
export function getAccessibleRoutes(): RouteGroup[] {
  return ALL_ROUTES;
}
