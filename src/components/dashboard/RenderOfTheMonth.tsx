import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useFeaturedRender } from "@/hooks/useFeaturedRender";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon } from "lucide-react";
import { getSignedUrl } from "@/lib/storage-helpers";

export function RenderOfTheMonth() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: render, isLoading } = useFeaturedRender(currentMonth);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (render?.imagen_path) {
        try {
          const { url } = await getSignedUrl({
            bucket: 'documentos',
            path: render.imagen_path,
            expiresInSeconds: 3600
          });
          setImageUrl(url);
        } catch (error) {
          console.error('Error loading render image:', error);
          setImageUrl(null);
        }
      } else {
        setImageUrl(null);
      }
    };
    
    loadImage();
  }, [render]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <Skeleton className="h-80 w-full" />
      </Card>
    );
  }

  if (!render) {
    return (
      <Card className="overflow-hidden bg-muted">
        <CardContent className="flex flex-col items-center justify-center h-80 p-6 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            No hay render del mes
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            El administrador aún no ha configurado el render destacado para este mes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={render.titulo}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 bg-primary/90 text-primary-foreground text-xs font-semibold rounded-full">
                🎨 RENDER DEL MES
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              {render.titulo}
            </h2>
            {render.autor && (
              <p className="text-sm md:text-base text-white/90">
                Por: {render.autor}
              </p>
            )}
          </div>
        </div>
        {render.caption && (
          <CardContent className="p-4 bg-background">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {render.caption}
            </p>
          </CardContent>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={render.titulo}
                className="w-full h-auto max-h-[80vh] object-contain bg-black"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                {render.titulo}
              </h2>
              {render.autor && (
                <p className="text-base md:text-lg mb-2">Por: {render.autor}</p>
              )}
              {render.caption && (
                <p className="text-sm md:text-base text-white/90 mt-3">
                  {render.caption}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
