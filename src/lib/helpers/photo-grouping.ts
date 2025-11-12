import { startOfWeek, endOfWeek, format, isSameWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export interface PhotoGroup {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  photos: any[];
}

/**
 * Agrupa fotos por semana
 */
export function groupPhotosByWeek(photos: any[]): PhotoGroup[] {
  if (!photos || photos.length === 0) return [];

  // Ordenar por fecha descendente
  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.fecha_foto).getTime() - new Date(a.fecha_foto).getTime()
  );

  const groups: Map<string, PhotoGroup> = new Map();

  sortedPhotos.forEach(photo => {
    const photoDate = new Date(photo.fecha_foto);
    const weekStart = startOfWeek(photoDate, { locale: es, weekStartsOn: 1 }); // Lunes
    const weekEnd = endOfWeek(photoDate, { locale: es, weekStartsOn: 1 }); // Domingo
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!groups.has(weekKey)) {
      const weekLabel = formatWeekLabel(weekStart, weekEnd);
      groups.set(weekKey, {
        weekStart,
        weekEnd,
        weekLabel,
        photos: []
      });
    }

    groups.get(weekKey)!.photos.push(photo);
  });

  return Array.from(groups.values());
}

/**
 * Formatea el label de la semana
 */
function formatWeekLabel(start: Date, end: Date): string {
  const startDay = format(start, 'd', { locale: es });
  const endDay = format(end, 'd', { locale: es });
  const month = format(end, 'MMMM', { locale: es });
  const year = format(end, 'yyyy');

  return `${startDay} - ${endDay} de ${month} ${year}`;
}

/**
 * Verifica si una fecha está en la semana actual
 */
export function isCurrentWeek(date: Date): boolean {
  return isSameWeek(date, new Date(), { locale: es, weekStartsOn: 1 });
}
