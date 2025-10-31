/**
 * Module definitions and permission keys.
 * Used to filter navigation based on user permissions.
 */
export const MODULES = [
  // Principal
  { key: 'dashboard', path: '/', label: 'Dashboard', group: 'Principal' },

  // CRM
  { key: 'leads', path: '/leads', label: 'Leads', group: 'CRM' },
  { key: 'clientes', path: '/clientes', label: 'Clientes', group: 'CRM' },

  // Proyectos
  { key: 'proyectos', path: '/proyectos', label: 'Proyectos', group: 'Proyectos' },
  { key: 'diseno', path: '/diseno', label: 'Diseño', group: 'Proyectos' },
  { key: 'presupuestos', path: '/presupuestos', label: 'Presupuestos', group: 'Proyectos' },
  { key: 'cronograma', path: '/cronograma', label: 'Cronograma de Gantt (Ejecutivo)', group: 'Proyectos' },
  { key: 'cronograma_parametrico', path: '/cronograma-parametrico', label: 'Cronograma Paramétrico', group: 'Proyectos' },

  // Construcción
  { key: 'construccion', path: '/construccion', label: 'Construcción', group: 'Construcción' },

  // Abastecimiento
  { key: 'proveedores', path: '/proveedores', label: 'Proveedores', group: 'Abastecimiento' },
  { key: 'ordenes_compra', path: '/ordenes-compra', label: 'Órdenes de Compra', group: 'Abastecimiento' },

  // Administración
  { key: 'finanzas', path: '/finanzas', label: 'Finanzas', group: 'Administración' },
  { key: 'contabilidad', path: '/contabilidad', label: 'Contabilidad', group: 'Administración' },
  { key: 'comisiones', path: '/comisiones', label: 'Comisiones', group: 'Administración' },

  // Gestión
  { key: 'usuarios', path: '/usuarios', label: 'Usuarios', group: 'Gestión' },
  { key: 'accesos', path: '/herramientas/accesos', label: 'Accesos', group: 'Gestión' },
  { key: 'sucursales', path: '/herramientas/sucursales', label: 'Sucursales', group: 'Gestión' },
  { key: 'centro_reglas', path: '/herramientas/reglas', label: 'Centro de Reglas', group: 'Gestión' },
  { key: 'contenido_corporativo', path: '/herramientas/contenido-corporativo', label: 'Contenido Corporativo', group: 'Gestión' },

  // Portal Cliente (solo para clientes, no mostrar en sidebar interno)
  { key: 'client_portal', path: '/client/home', label: 'Mi Proyecto', group: 'ClientOnly' },
] as const;

export type ModuleKey = typeof MODULES[number]['key'];
