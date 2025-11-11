import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCorporatePromotions } from "@/hooks/useCorporatePromotions";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CorporatePromotions() {
  const { data: promotions, isLoading } = useCorporatePromotions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);

  useEffect(() => {
    if (promotions) {
      promotions.forEach((promo) => {
        if (promo.imagen_path) {
          const { data } = supabase.storage
            .from('documentos')
            .getPublicUrl(promo.imagen_path);
          setImageUrls((prev) => ({ ...prev, [promo.id]: data.publicUrl }));
        }
      });
    }
  }, [promotions]);

  const nextPromotion = () => {
    if (promotions && currentIndex < promotions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevPromotion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (promotions) {
      setCurrentIndex(promotions.length - 1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Promociones Corporativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Promociones Corporativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay promociones activas en este momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPromotion = promotions[currentIndex];

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Promociones Corporativas
            </CardTitle>
            {promotions.length > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={prevPromotion}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentIndex + 1}/{promotions.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={nextPromotion}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="cursor-pointer group"
            onClick={() => setSelectedPromotion(currentPromotion)}
          >
            {currentPromotion.imagen_path && imageUrls[currentPromotion.id] && (
              <div className="relative aspect-video mb-3 rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrls[currentPromotion.id]}
                  alt={currentPromotion.titulo}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {currentPromotion.titulo}
              </h3>
              {currentPromotion.descripcion && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {currentPromotion.descripcion}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {new Date(currentPromotion.fecha_inicio).toLocaleDateString('es-MX', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {' - '}
                  {new Date(currentPromotion.fecha_fin).toLocaleDateString('es-MX', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Activa
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPromotion && (
        <Dialog open={!!selectedPromotion} onOpenChange={() => setSelectedPromotion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPromotion.titulo}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedPromotion.imagen_path && imageUrls[selectedPromotion.id] && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imageUrls[selectedPromotion.id]}
                    alt={selectedPromotion.titulo}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              {selectedPromotion.descripcion && (
                <p className="text-sm text-muted-foreground">
                  {selectedPromotion.descripcion}
                </p>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Badge>
                  {new Date(selectedPromotion.fecha_inicio).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
                <span className="text-muted-foreground">hasta</span>
                <Badge>
                  {new Date(selectedPromotion.fecha_fin).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
