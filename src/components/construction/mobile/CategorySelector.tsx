import { Check, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PHOTO_CATEGORIES } from '@/lib/constants/photo-categories';

interface CategorySelectorProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export function CategorySelector({ selectedCategory, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PHOTO_CATEGORIES.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.value;
        
        return (
          <Button
            key={category.value}
            variant={isSelected ? "default" : "outline"}
            className="h-auto py-4 flex flex-col gap-2 relative"
            onClick={() => onSelect(category.value)}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium text-center leading-tight">
              {category.label}
            </span>
            {isSelected && (
              <Check className="h-4 w-4 absolute top-2 right-2" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
