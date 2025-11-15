import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  UserCircle,
  Target,
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
  MapPin,
  FileText,
  Building2,
  Handshake,
  Users,
  ShieldCheck,
  ListTree,
  Eye,
  MessageSquare,
  CalendarDays,
  CheckSquare,
  Image,
  Mail,
} from "lucide-react";
import { BACKOFFICE_ROUTES } from "./routes";

export type SidebarItem = {
  title: string;
  url: string;
  icon: any;
  moduleName: string; // For permission checks
  children?: SidebarItem[];
};

export type SidebarSection = {
  label: string;
  items: SidebarItem[];
};

/**
 * Canonical sidebar structure - single source of truth for navigation
 * Each item maps to a route and a permission module
 * 
 * IMPORTANTE: Todas las URLs usan constantes de @/config/routes
 */
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: "Principal",
    items: [
      { 
        title: "Dashboard", 
        url: BACKOFFICE_ROUTES.DASHBOARD, 
        icon: LayoutDashboard, 
        moduleName: "dashboard" 
      },
      { 
        title: "Mi Calendario", 
        url: BACKOFFICE_ROUTES.MI_CALENDARIO, 
        icon: CalendarDays, 
        moduleName: "proyectos" 
      },
      { 
        title: "Mis Chats", 
        url: BACKOFFICE_ROUTES.MIS_CHATS, 
        icon: MessageSquare, 
        moduleName: "proyectos" 
      },
    ],
  },
  {
    label: "CRM",
    items: [
      { 
        title: "Leads", 
        url: BACKOFFICE_ROUTES.LEADS, 
        icon: Target, 
        moduleName: "leads" 
      },
      { 
        title: "Tareas", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_TAREAS, 
        icon: CheckSquare, 
        moduleName: "crm" 
      },
      { 
        title: "Clientes", 
        url: BACKOFFICE_ROUTES.CLIENTES, 
        icon: Users, 
        moduleName: "clientes" 
      },
      { 
        title: "Ver como cliente", 
        url: BACKOFFICE_ROUTES.VER_COMO_CLIENTE, 
        icon: Eye, 
        moduleName: "crm" 
      },
    ],
  },
  {
    label: "ERP",
    items: [
      { 
        title: "Transacciones Unificadas", 
        url: BACKOFFICE_ROUTES.ERP_TRANSACTIONS, 
        icon: ListTree, 
        moduleName: "herramientas" 
      },
      { 
        title: "Presupuestos", 
        url: BACKOFFICE_ROUTES.PRESUPUESTOS, 
        icon: Calculator, 
        moduleName: "presupuestos" 
      },
      { 
        title: "Proveedores", 
        url: BACKOFFICE_ROUTES.PROVEEDORES, 
        icon: Truck, 
        moduleName: "proveedores" 
      },
    ],
  },
  {
    label: "Proyectos / Construcción",
    items: [
      { 
        title: "Proyectos", 
        url: BACKOFFICE_ROUTES.PROYECTOS, 
        icon: FolderKanban, 
        moduleName: "proyectos" 
      },
      { 
        title: "Diseño", 
        url: BACKOFFICE_ROUTES.DISENO, 
        icon: PenTool, 
        moduleName: "diseno" 
      },
      { 
        title: "Cronograma de Gantt", 
        url: BACKOFFICE_ROUTES.GANTT, 
        icon: Calendar, 
        moduleName: "cronograma" 
      },
      { 
        title: "Construcción", 
        url: BACKOFFICE_ROUTES.CONSTRUCCION, 
        icon: Truck, 
        moduleName: "construccion" 
      },
      { 
        title: "Órdenes de Compra", 
        url: BACKOFFICE_ROUTES.ORDENES_COMPRA, 
        icon: ShoppingCart, 
        moduleName: "ordenes_compra" 
      },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { 
        title: "Pagos a Proveedores", 
        url: BACKOFFICE_ROUTES.LOTES_PAGO, 
        icon: DollarSign, 
        moduleName: "lotes_pago" 
      },
      { 
        title: "Contabilidad", 
        url: BACKOFFICE_ROUTES.CONTABILIDAD, 
        icon: Receipt, 
        moduleName: "contabilidad" 
      },
      { 
        title: "Comisiones", 
        url: BACKOFFICE_ROUTES.COMISIONES, 
        icon: Percent, 
        moduleName: "comisiones" 
      },
    ],
  },
  {
    label: "Gestión / Herramientas",
    items: [
      { 
        title: "Contenido Corporativo", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_CONTENIDO, 
        icon: Building2, 
        moduleName: "contenido_corporativo" 
      },
      { 
        title: "Métricas", 
        url: BACKOFFICE_ROUTES.METRICS, 
        icon: TrendingUp, 
        moduleName: "herramientas" 
      },
      { 
        title: "Sucursales", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_SUCURSALES, 
        icon: MapPin, 
        moduleName: "sucursales" 
      },
      { 
        title: "Alianzas", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_ALIANZAS, 
        icon: Handshake, 
        moduleName: "herramientas" 
      },
      { 
        title: "Gestión de Usuarios", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_GESTION_USUARIOS, 
        icon: Users, 
        moduleName: "usuarios" 
      },
      { 
        title: "Accesos", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_ACCESOS, 
        icon: ShieldCheck, 
        moduleName: "accesos" 
      },
      { 
        title: "Centro de Reglas", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_REGLAS, 
        icon: FileText, 
        moduleName: "centro_reglas" 
      },
      { 
        title: "Configuración Email", 
        url: BACKOFFICE_ROUTES.HERRAMIENTAS_EMAIL_CONFIG, 
        icon: Mail, 
        moduleName: "herramientas" 
      },
    ],
  },
];

/**
 * Flattens sidebar sections into a single array of items for route validation
 */
export function getAllSidebarItems(): SidebarItem[] {
  const items: SidebarItem[] = [];
  
  SIDEBAR_SECTIONS.forEach(section => {
    section.items.forEach(item => {
      items.push(item);
      if (item.children) {
        items.push(...item.children);
      }
    });
  });
  
  return items;
}

/**
 * Get all unique module names from sidebar for permission validation
 */
export function getAllModuleNames(): string[] {
  const modules = new Set<string>();
  
  getAllSidebarItems().forEach(item => {
    modules.add(item.moduleName);
  });
  
  return Array.from(modules);
}
