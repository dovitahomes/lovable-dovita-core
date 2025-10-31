import {
  LayoutDashboard,
  TrendingUp,
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
  MapPin,
  FileText,
  Building2,
  Handshake,
  Users,
  ShieldCheck,
  ListTree,
} from "lucide-react";

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
 */
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: "Principal",
    items: [
      { 
        title: "Dashboard", 
        url: "/", 
        icon: LayoutDashboard, 
        moduleName: "dashboard" 
      },
    ],
  },
  {
    label: "CRM",
    items: [
      { 
        title: "Leads", 
        url: "/leads", 
        icon: TrendingUp, 
        moduleName: "leads" 
      },
      { 
        title: "Clientes", 
        url: "/clientes", 
        icon: Briefcase, 
        moduleName: "clientes" 
      },
    ],
  },
  {
    label: "ERP",
    items: [
      { 
        title: "Transacciones Unificadas", 
        url: "/erp/transactions", 
        icon: ListTree, 
        moduleName: "herramientas" 
      },
      { 
        title: "Presupuestos", 
        url: "/presupuestos", 
        icon: Calculator, 
        moduleName: "presupuestos" 
      },
      { 
        title: "Proveedores", 
        url: "/proveedores", 
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
        url: "/proyectos", 
        icon: FolderKanban, 
        moduleName: "proyectos" 
      },
      { 
        title: "Diseño", 
        url: "/diseno", 
        icon: PenTool, 
        moduleName: "diseno" 
      },
      { 
        title: "Cronograma de Gantt", 
        url: "/gantt", 
        icon: Calendar, 
        moduleName: "cronograma" 
      },
      { 
        title: "Construcción", 
        url: "/construccion", 
        icon: Truck, 
        moduleName: "construccion" 
      },
      { 
        title: "Órdenes de Compra", 
        url: "/ordenes-compra", 
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
        url: "/lotes-pago", 
        icon: DollarSign, 
        moduleName: "lotes_pago" 
      },
      { 
        title: "Contabilidad", 
        url: "/contabilidad", 
        icon: Receipt, 
        moduleName: "contabilidad" 
      },
      { 
        title: "Comisiones", 
        url: "/comisiones", 
        icon: Percent, 
        moduleName: "comisiones" 
      },
    ],
  },
  {
    label: "Gestión",
    items: [
      { 
        title: "Usuarios", 
        url: "/usuarios", 
        icon: UserCog, 
        moduleName: "usuarios" 
      },
      { 
        title: "Métricas", 
        url: "/metrics", 
        icon: TrendingUp, 
        moduleName: "herramientas" 
      },
      { 
        title: "Contenido Corporativo", 
        url: "/herramientas/contenido-corporativo", 
        icon: Building2, 
        moduleName: "contenido_corporativo" 
      },
      { 
        title: "Sucursales", 
        url: "/herramientas/sucursales", 
        icon: MapPin, 
        moduleName: "sucursales" 
      },
      { 
        title: "Alianzas", 
        url: "/herramientas/alianzas", 
        icon: Handshake, 
        moduleName: "herramientas" 
      },
      { 
        title: "Identidades", 
        url: "/herramientas/identidades", 
        icon: Users, 
        moduleName: "herramientas" 
      },
      { 
        title: "Accesos", 
        url: "/herramientas/accesos", 
        icon: ShieldCheck, 
        moduleName: "accesos" 
      },
      { 
        title: "Centro de Reglas", 
        url: "/herramientas/reglas", 
        icon: FileText, 
        moduleName: "centro_reglas" 
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
