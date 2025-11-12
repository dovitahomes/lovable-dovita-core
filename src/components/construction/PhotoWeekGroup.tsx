import { Calendar, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { isCurrentWeek } from '@/lib/helpers/photo-grouping';
import type { PhotoGroup } from '@/lib/helpers/photo-grouping';

interface PhotoWeekGroupProps {
  group: PhotoGroup;
  children: React.ReactNode;
}

export function PhotoWeekGroup({ group, children }: PhotoWeekGroupProps) {
  const isCurrent = isCurrentWeek(group.weekStart);

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <Card className={`p-4 ${isCurrent ? 'border-primary bg-primary/5' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
              <Calendar className={`h-5 w-5 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {group.weekLabel}
                {isCurrent && (
                  <Badge variant="default" className="text-xs">
                    Esta semana
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {group.photos.length} {group.photos.length === 1 ? 'fotografía' : 'fotografías'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Photos Grid */}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
