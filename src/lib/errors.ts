/**
 * Manejo centralizado de errores Supabase
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function mapSupabaseError(error: any): AppError {
  // Error de autenticación
  if (error.code === 'PGRST116' || error.message?.includes('JWT')) {
    return new AppError(
      "Sesión expirada. Por favor, recarga la página.",
      'AUTH_SESSION_EXPIRED',
      401
    );
  }

  // Error de permisos
  if (error.code === '42501' || error.message?.includes('permission')) {
    return new AppError(
      "No tienes permisos para realizar esta acción.",
      'PERMISSION_DENIED',
      403
    );
  }

  // Violación de unicidad
  if (error.code === '23505') {
    return new AppError(
      "Ya existe un registro con estos datos.",
      'DUPLICATE_ENTRY',
      409
    );
  }

  // Violación de clave foránea
  if (error.code === '23503') {
    return new AppError(
      "No se puede eliminar: existen registros relacionados.",
      'FOREIGN_KEY_VIOLATION',
      409
    );
  }

  // Error genérico
  return new AppError(
    error.message || "Ocurrió un error inesperado",
    error.code,
    error.statusCode || 500
  );
}
