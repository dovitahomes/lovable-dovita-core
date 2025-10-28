import { useState } from "react";
import { FileText, Image as ImageIcon, File, Download, Eye, Trash2 } from "lucide-react";
import { Section } from "@/components/client/Section";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Document {
  id: string;
  nombre: string;
  file_type?: string | null;
  file_size?: number | null;
  file_url: string;
  created_at: string;
  uploaded_by?: string | null;
}

interface DocumentListProps {
  documents: Document[];
  onView: (doc: Document) => void;
  onDelete?: (docId: string) => void;
}

export function DocumentList({ documents, onView, onDelete }: DocumentListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return File;
    if (mimeType.startsWith("image/")) return ImageIcon;
    if (mimeType === "application/pdf") return FileText;
    return File;
  };

  const getFileTypeLabel = (mimeType?: string | null) => {
    if (!mimeType) return "Archivo";
    if (mimeType.startsWith("image/")) return "Imagen";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType.includes("word")) return "Word";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "Excel";
    return "Archivo";
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.nombre.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "pdf" && doc.file_type === "application/pdf") ||
      (typeFilter === "image" && doc.file_type?.startsWith("image/")) ||
      (typeFilter === "office" &&
        (doc.file_type?.includes("word") || doc.file_type?.includes("sheet")));

    return matchesSearch && matchesType;
  });

  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, "_blank");
  };

  const confirmDelete = () => {
    if (deleteDocId && onDelete) {
      onDelete(deleteDocId);
      setDeleteDocId(null);
    }
  };

  return (
    <>
      <Section title="Mis Documentos">
        {/* Filters */}
        <div className="space-y-3 mb-4">
          <Input
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="image">Imágenes</SelectItem>
              <SelectItem value="office">Office (Word/Excel)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document list */}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">
              {search || typeFilter !== "all"
                ? "No se encontraron documentos"
                : "Aún no has subido documentos"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map((doc) => {
              const Icon = getFileIcon(doc.file_type);
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <Icon className="h-5 w-5 text-[hsl(var(--dovita-blue))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {doc.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-xs bg-slate-100 text-slate-700"
                        >
                          {getFileTypeLabel(doc.file_type)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(doc.created_at), "d MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(doc)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDocId(doc.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento se eliminará
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
