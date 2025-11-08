import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Filter,
  FileIcon,
  FileSpreadsheet,
  FileCode,
  FileImage,
  Loader2
} from "lucide-react";
import { useCompanyManuals } from "@/hooks/useCompanyManuals";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

const CATEGORIES = [
  { value: "todos", label: "Todas las categorías" },
  { value: "ventas", label: "Ventas" },
  { value: "construccion", label: "Construcción" },
  { value: "diseno", label: "Diseño" },
  { value: "administracion", label: "Administración" },
  { value: "recursos_humanos", label: "Recursos Humanos" },
  { value: "finanzas", label: "Finanzas" },
  { value: "legal", label: "Legal" },
  { value: "otros", label: "Otros" },
];

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'ppt':
    case 'pptx':
      return <FileCode className="h-5 w-5 text-orange-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="h-5 w-5 text-purple-500" />;
    default:
      return <FileIcon className="h-5 w-5 text-muted-foreground" />;
  }
}

export function CompanyManuals() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  
  const { data: manuals, isLoading } = useCompanyManuals(
    selectedCategory === "todos" ? undefined : selectedCategory,
    debouncedSearch
  );

  const handleDownload = async (filePath: string, titulo: string) => {
    try {
      setDownloadingId(filePath);
      
      const { data, error } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      // Descargar el archivo
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = titulo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Archivo descargado");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error al descargar archivo");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (filePath: string) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error("Error viewing file:", error);
      toast.error("Error al abrir archivo");
    }
  };

  // Paginación
  const totalPages = Math.ceil((manuals?.length || 0) / ITEMS_PER_PAGE);
  const paginatedManuals = manuals?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Manuales de Operación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Búsqueda y Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar manuales..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset a página 1 al buscar
              }}
              className="pl-10"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select value={selectedCategory} onValueChange={(value) => {
              setSelectedCategory(value);
              setCurrentPage(1); // Reset a página 1 al filtrar
            }}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Documentos */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !paginatedManuals || paginatedManuals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron manuales</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedManuals.map((manual) => (
              <div
                key={manual.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    {getFileIcon(manual.file_path)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {manual.titulo}
                    </h4>
                    {manual.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {manual.descripcion}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {manual.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES.find(c => c.value === manual.categoria)?.label || manual.categoria}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(manual.updated_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(manual.file_path)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDownload(manual.file_path, manual.titulo)}
                    disabled={downloadingId === manual.file_path}
                  >
                    {downloadingId === manual.file_path ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Descargar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Resumen */}
        {manuals && manuals.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, manuals.length)} de {manuals.length} manuales
          </p>
        )}
      </CardContent>
    </Card>
  );
}
