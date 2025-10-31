import {
  LayoutDashboard,
  Users,
  Briefcase,
  FolderKanban,
  PenTool,
  Calculator,
  Calendar,
  Truck,
  ShoppingCart,
  DollarSign,
  Receipt,
  Percent,
  UserCog,
  ShieldCheck,
  MapPin,
  FileText,
  Building2,
  TrendingUp,
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
      { title: "Clientes", url: "/clientes", icon: Briefcase, moduleName: "clientes" },
    ],
  },
  {
    label: "Proyectos",
    items: [
      { title: "Proyectos", url: "/proyectos", icon: FolderKanban, moduleName: "proyectos" },
      { title: "Diseño", url: "/diseno", icon: PenTool, moduleName: "diseno" },
      { title: "Presupuestos", url: "/presupuestos", icon: Calculator, moduleName: "presupuestos" },
      { title: "Cronograma de Gantt (Ejecutivo)", url: "/cronograma", icon: Calendar, moduleName: "cronograma" },
      { title: "Cronograma Paramétrico", url: "/cronograma-parametrico", icon: Calendar, moduleName: "cronograma_parametrico" },
    ],
  },
  {
    label: "Construcción",
    items: [
      { title: "Construcción", url: "/construccion", icon: Truck, moduleName: "construccion" },
    ],
  },
  {
    label: "Abastecimiento",
    items: [
      { title: "Proveedores", url: "/proveedores", icon: Truck, moduleName: "proveedores" },
      { title: "Órdenes de Compra", url: "/ordenes-compra", icon: ShoppingCart, moduleName: "ordenes_compra" },
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
    label: "Gestión",
    items: [
      { title: "Usuarios", url: "/usuarios", icon: UserCog, moduleName: "usuarios" },
      { title: "Accesos", url: "/herramientas/accesos", icon: ShieldCheck, moduleName: "accesos" },
      { title: "Sucursales", url: "/herramientas/sucursales", icon: MapPin, moduleName: "sucursales" },
      { title: "Centro de Reglas", url: "/herramientas/reglas", icon: FileText, moduleName: "centro_reglas" },
      { title: "Contenido Corporativo", url: "/herramientas/contenido-corporativo", icon: Building2, moduleName: "contenido_corporativo" },
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
