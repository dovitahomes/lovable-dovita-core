/**
 * Module definitions and permission keys.
 * Used to filter navigation based on user permissions.
 */
export const MODULES = [
  { key: 'dashboard', path: '/', label: 'Dashboard' },
  { key: 'leads', path: '/leads', label: 'Leads' },
  { key: 'clientes', path: '/clientes', label: 'Clientes' },
  { key: 'proyectos', path: '/proyectos', label: 'Proyectos' },
  { key: 'diseno', path: '/diseno', label: 'Diseño' },
  { key: 'presupuestos', path: '/presupuestos', label: 'Presupuestos' },
  { key: 'cronograma', path: '/cronograma', label: 'Cronograma' },
  { key: 'construccion', path: '/construccion', label: 'Construcción' },
  { key: 'proveedores', path: '/proveedores', label: 'Proveedores' },
  { key: 'finanzas', path: '/finanzas', label: 'Finanzas' },
  { key: 'contabilidad', path: '/contabilidad', label: 'Contabilidad' },
  { key: 'comisiones', path: '/comisiones', label: 'Comisiones' },
  { key: 'usuarios', path: '/usuarios', label: 'Usuarios' },
  { key: 'herramientas', path: '/herramientas', label: 'Herramientas' },
  { key: 'client_portal', path: '/client', label: 'Portal Cliente' },
] as const;

export type ModuleKey = typeof MODULES[number]['key'];
