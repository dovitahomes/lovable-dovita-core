import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Download, 
  Search, 
  Eye,
  Filter,
  CheckSquare,
  Download as DownloadIcon,
  Image as ImageIcon,
  File
} from "lucide-react";
import DocumentViewer from '@/components/client-app/DocumentViewer';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useClientDocuments } from '@/hooks/client-app/useClientData';
import { ClientEmptyState, ClientLoadingState } from '@/components/client-app/ClientSkeletons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DocumentCategory = 'all' | 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion' | 'contractual' | 'presupuesto';

export default function DocumentsDesktop() {
  const { currentProject } = useProject();
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    type: string;
    url?: string;
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('all');
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Fetch documents using unified hook
  const { data: allDocuments = [], isLoading } = useClientDocuments(currentProject?.id || null);

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    let filtered = allDocuments;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allDocuments, selectedCategory, searchQuery]);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<DocumentCategory, number> = {
      all: allDocuments.length,
      cliente: 0,
      proyecto: 0,
      legal: 0,
      diseno: 0,
      construccion: 0,
      contractual: 0,
      presupuesto: 0,
    };

    allDocuments.forEach(doc => {
      const category = doc.category as DocumentCategory;
      if (category in counts) {
        counts[category]++;
      }
    });

    return counts;
  }, [allDocuments]);

  const handleViewDocument = (doc: any) => {
    setSelectedDocument({
      name: doc.name,
      type: doc.type,
      url: doc.url,
    });
    setViewerOpen(true);
  };

  const handleSelectDoc = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDocs.size === filteredDocuments.length) {
      setSelectedDocs(new Set());
    } else {
      setSelectedDocs(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const handleDownloadSelected = async () => {
    const docsToDownload = filteredDocuments.filter(d => selectedDocs.has(d.id));
    for (const doc of docsToDownload) {
      try {
        const response = await fetch(doc.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('Error downloading:', error);
      }
    }
    setSelectedDocs(new Set());
  };

  const categories: { value: DocumentCategory; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'diseno', label: 'Diseño' },
    { value: 'contractual', label: 'Contrato' },
    { value: 'construccion', label: 'Construcción' },
    { value: 'legal', label: 'Legal' },
    { value: 'presupuesto', label: 'Presupuesto' },
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type === 'pdf') {
      return <FileText className="h-4 w-4 text-red-600" />;
    }
    if (type.includes('image') || type === 'image') {
      return <ImageIcon className="h-4 w-4 text-blue-600" />;
    }
    return <File className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documentos</h1>
          <p className="text-muted-foreground">Todos los documentos de tu proyecto ({filteredDocuments.length})</p>
        </div>
        {selectedDocs.size > 0 && (
          <Button onClick={handleDownloadSelected}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Descargar Seleccionados ({selectedDocs.size})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar documentos..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrar:</span>
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.value)}
                  >
                    {cat.label}
                    <Badge variant="secondary" className="ml-2">
                      {categoryCounts[cat.value]}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <ClientLoadingState message="Cargando documentos..." />
          ) : filteredDocuments.length === 0 ? (
            <ClientEmptyState
              icon={FileText}
              title="No hay documentos"
              description={searchQuery 
                ? 'No se encontraron documentos con esa búsqueda' 
                : 'No hay documentos en esta categoría'}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover-lift transition-smooth">
                    <TableCell>
                      <Checkbox
                        checked={selectedDocs.has(doc.id)}
                        onCheckedChange={() => handleSelectDoc(doc.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {getFileIcon(doc.type)}
                        </div>
                        <span className="truncate max-w-md">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.size}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={async () => {
                            try {
                              const response = await fetch(doc.url);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = doc.name;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              console.error('Error downloading:', error);
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
    </div>
  );
}
