import { format as dateFnsFormat, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

/**
 * Zona horaria oficial de la plataforma
 * Ciudad de México (UTC-6/UTC-5 con horario de verano)
 */
export const MEXICO_TZ = 'America/Mexico_City';

/**
 * Formatea una fecha date-only (YYYY-MM-DD) sin conversiones de zona horaria.
 * Usar para: fecha_nacimiento, fecha_ingreso, etc.
 * 
 * @example formatDateOnly("1990-06-18") → "18 jun 1990"
 */
export function formatDateOnly(dateString: string, formatStr: string = 'dd MMM yyyy'): string {
  // Usar mediodía UTC para evitar shifts de ±1 día
  const date = new Date(dateString + 'T12:00:00.000Z');
  return dateFnsFormat(date, formatStr, { locale: es });
}

/**
 * Formatea un timestamp (ISO 8601) en la zona horaria de Ciudad de México.
 * Usar para: created_at, start_at, end_at de eventos/citas, etc.
 * 
 * @example formatDateTime("2025-11-08T20:00:00Z") → "08 nov 2025 14:00" (CDMX)
 */
export function formatDateTime(
  isoString: string, 
  formatStr: string = 'dd MMM yyyy HH:mm'
): string {
  return formatInTimeZone(isoString, MEXICO_TZ, formatStr, { locale: es });
}

/**
 * Convierte una fecha/hora local de México a UTC ISO string para guardar en DB.
 * 
 * @param localDateTimeString - "2025-11-08T14:00" (del input datetime-local)
 * @returns "2025-11-08T20:00:00.000Z" (UTC)
 */
export function toUTCFromMexico(localDateTimeString: string): string {
  // fromZonedTime interpreta la fecha como si estuviera en MEXICO_TZ
  const cdmxDate = fromZonedTime(localDateTimeString, MEXICO_TZ);
  return cdmxDate.toISOString();
}

/**
 * Convierte un timestamp UTC a fecha/hora local de México.
 * Útil para prellenar inputs datetime-local.
 * 
 * @param isoString - "2025-11-08T20:00:00Z"
 * @returns "2025-11-08T14:00" (CDMX, formato para input)
 */
export function fromUTCToMexico(isoString: string): string {
  const cdmxDate = toZonedTime(isoString, MEXICO_TZ);
  // Formatear como "YYYY-MM-DDTHH:mm" para datetime-local
  return dateFnsFormat(cdmxDate, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Obtiene la fecha/hora actual en Ciudad de México (no UTC).
 * 
 * @returns Date object en zona horaria de México
 */
export function nowInMexico(): Date {
  return toZonedTime(new Date(), MEXICO_TZ);
}

/**
 * Verifica si dos fechas son el mismo día en zona horaria de México.
 * 
 * @example isSameDayInMexico("2025-11-08T05:00:00Z", "2025-11-08T06:00:00Z") → true
 */
export function isSameDayInMexico(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const cdmx1 = toZonedTime(d1, MEXICO_TZ);
  const cdmx2 = toZonedTime(d2, MEXICO_TZ);
  
  return (
    cdmx1.getFullYear() === cdmx2.getFullYear() &&
    cdmx1.getMonth() === cdmx2.getMonth() &&
    cdmx1.getDate() === cdmx2.getDate()
  );
}
