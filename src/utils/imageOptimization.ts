/**
 * Utilidades para optimización de imágenes
 */

/**
 * Genera srcset para imágenes responsive
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(", ");
}

/**
 * Calcula el tamaño de imagen más apropiado basado en viewport
 */
export function getOptimalImageSize(containerWidth: number): number {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const baseWidth = containerWidth * devicePixelRatio;
  
  // Round up to nearest standard width
  const standardWidths = [320, 640, 768, 1024, 1280, 1536, 1920];
  return standardWidths.find(w => w >= baseWidth) || 1920;
}

/**
 * Lazy load de imágenes con Intersection Observer
 */
export function lazyLoadImage(imgElement: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: "50px", // Pre-load 50px before entering viewport
  });

  observer.observe(imgElement);
  return () => observer.disconnect();
}

/**
 * Convierte blob a WebP si el navegador lo soporta
 */
export async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert to WebP'));
          }
        },
        'image/webp',
        0.9
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Verifica si el navegador soporta WebP
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}
