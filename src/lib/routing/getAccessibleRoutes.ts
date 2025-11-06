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
import { BACKOFFICE_ROUTES } from "@/config/routes";

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
      { title: "Dashboard", url: BACKOFFICE_ROUTES.DASHBOARD, icon: LayoutDashboard, moduleName: "dashboard" },
    ],
  },
  {
    label: "CRM",
    items: [
      { title: "Leads", url: BACKOFFICE_ROUTES.LEADS, icon: TrendingUp, moduleName: "leads" },
      { title: "Clientes", url: BACKOFFICE_ROUTES.CLIENTES, icon: Briefcase, moduleName: "clientes" },
    ],
  },
  {
    label: "Proyectos",
    items: [
      { title: "Proyectos", url: BACKOFFICE_ROUTES.PROYECTOS, icon: FolderKanban, moduleName: "proyectos" },
      { title: "Diseño", url: BACKOFFICE_ROUTES.DISENO, icon: PenTool, moduleName: "diseno" },
      { title: "Presupuestos", url: BACKOFFICE_ROUTES.PRESUPUESTOS, icon: Calculator, moduleName: "presupuestos" },
      { title: "Cronograma de Gantt", url: BACKOFFICE_ROUTES.GANTT, icon: Calendar, moduleName: "cronograma" },
    ],
  },
  {
    label: "Construcción",
    items: [
      { title: "Construcción", url: BACKOFFICE_ROUTES.CONSTRUCCION, icon: Truck, moduleName: "construccion" },
    ],
  },
  {
    label: "Abastecimiento",
    items: [
      { title: "Proveedores", url: BACKOFFICE_ROUTES.PROVEEDORES, icon: Truck, moduleName: "proveedores" },
      { title: "Órdenes de Compra", url: BACKOFFICE_ROUTES.ORDENES_COMPRA, icon: ShoppingCart, moduleName: "ordenes_compra" },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Contabilidad", url: BACKOFFICE_ROUTES.CONTABILIDAD, icon: Receipt, moduleName: "contabilidad" },
      { title: "Lotes de Pago", url: BACKOFFICE_ROUTES.LOTES_PAGO, icon: DollarSign, moduleName: "lotes_pago" },
      { title: "Comisiones", url: BACKOFFICE_ROUTES.COMISIONES, icon: Percent, moduleName: "comisiones" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { title: "Usuarios", url: BACKOFFICE_ROUTES.USUARIOS, icon: UserCog, moduleName: "usuarios" },
      { title: "Accesos", url: BACKOFFICE_ROUTES.HERRAMIENTAS_ACCESOS, icon: ShieldCheck, moduleName: "accesos" },
      { title: "Sucursales", url: BACKOFFICE_ROUTES.HERRAMIENTAS_SUCURSALES, icon: MapPin, moduleName: "sucursales" },
      { title: "Centro de Reglas", url: BACKOFFICE_ROUTES.HERRAMIENTAS_REGLAS, icon: FileText, moduleName: "centro_reglas" },
      { title: "Contenido Corporativo", url: BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO, icon: Building2, moduleName: "contenido_corporativo" },
    ],
  },
];

export const MINIMAL_ROUTES: RouteGroup[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", url: BACKOFFICE_ROUTES.DASHBOARD, icon: LayoutDashboard, moduleName: "dashboard" },
    ],
  },
];

// Temporarily simplified - will be restored in Prompt 2
export function getAccessibleRoutes(): RouteGroup[] {
  return ALL_ROUTES;
}
