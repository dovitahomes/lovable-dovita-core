import { Layers, Building2, Blocks, Zap, Paintbrush, TreePine, Ellipsis } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface PhotoCategory {
  value: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    value: 'cimentacion',
    label: 'Cimentación',
    icon: Layers,
    description: 'Zapatas, trabes de cimentación, losa de cimentación',
  },
  {
    value: 'estructura',
    label: 'Estructura',
    icon: Building2,
    description: 'Columnas, trabes, losas, estructura metálica',
  },
  {
    value: 'albanileria',
    label: 'Albañilería',
    icon: Blocks,
    description: 'Muros, block, tabique, aplanados',
  },
  {
    value: 'instalaciones',
    label: 'Instalaciones',
    icon: Zap,
    description: 'Eléctricas, hidráulicas, sanitarias, gas',
  },
  {
    value: 'acabados',
    label: 'Acabados',
    icon: Paintbrush,
    description: 'Pisos, azulejos, pintura, cancelería, herrería',
  },
  {
    value: 'exteriores',
    label: 'Exteriores',
    icon: TreePine,
    description: 'Jardines, banquetas, estacionamiento, fachada',
  },
  {
    value: 'otros',
    label: 'Otros',
    icon: Ellipsis,
    description: 'Otras fotografías generales',
  },
];

export function getCategoryById(value: string): PhotoCategory | undefined {
  return PHOTO_CATEGORIES.find(cat => cat.value === value);
}

export function getCategoryLabel(value: string): string {
  return getCategoryById(value)?.label || 'Sin categoría';
}

export function getCategoryIcon(value: string): LucideIcon {
  return getCategoryById(value)?.icon || Ellipsis;
}
