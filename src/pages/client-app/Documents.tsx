import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Download, 
  Image as ImageIcon, 
  Eye, 
  Search,
  Filter,
  CheckSquare,
  Download as DownloadIcon,
  File
} from 'lucide-react';
import DocumentViewer from '@/components/client-app/DocumentViewer';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useClientDocuments } from '@/hooks/client-app/useClientData';
import type { Document } from '@/lib/client-app/client-data';
import { DocumentsListSkeleton, ClientEmptyState } from '@/components/client-app/ClientSkeletons';

type DocumentCategory = 'all' | 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion' | 'contractual' | 'presupuesto';

export default function Documents() {
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
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type === 'pdf') {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    if (type.includes('image') || type === 'image') {
      return <ImageIcon className="h-5 w-5 text-blue-600" />;
    }
    return <File className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="h-full overflow-y-auto pb-[130px]">
      {/* Header con Degradado */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-1">Documentos</h1>
            <p className="text-sm text-white/90">
              Accede a todos los documentos de tu proyecto
            </p>
          </div>
          {/* Badge Contador */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-semibold">{filteredDocuments.length}</span>
            </div>
            <p className="text-xs text-white/80 mt-1">docs</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar documentos..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por Categoría</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                size="sm"
                className="justify-start"
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
                <Badge variant="secondary" className="ml-auto">
                  {categoryCounts[cat.value]}
                </Badge>
              </Button>
            ))}
          </div>
        </Card>

        {/* Batch Actions */}
        {selectedDocs.size > 0 && (
          <Card className="p-4 border-primary bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedDocs.size} seleccionados</span>
              </div>
              <Button size="sm" onClick={handleDownloadSelected}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                Descargar Todos
              </Button>
            </div>
          </Card>
        )}

        {/* Select All */}
        {filteredDocuments.length > 0 && (
          <div className="flex items-center gap-2 px-2">
            <Checkbox
              checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Seleccionar todos ({filteredDocuments.length})
            </span>
          </div>
        )}

        {/* Document List */}
        {isLoading ? (
          <DocumentsListSkeleton count={5} />
        ) : filteredDocuments.length === 0 ? (
          <ClientEmptyState
            icon={FileText}
            title="No hay documentos"
            description={searchQuery 
              ? 'No se encontraron documentos con esa búsqueda' 
              : 'No hay documentos en esta categoría'}
          />
        ) : (
          <div className="space-y-2 animate-fade-in">
            {filteredDocuments.map((doc, index) => (
              <Card 
                key={doc.id} 
                className="hover-lift transition-smooth"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedDocs.has(doc.id)}
                      onCheckedChange={() => handleSelectDoc(doc.id)}
                      className="mt-1"
                    />
                    
                    <div className="p-2 rounded-lg bg-primary/10">
                      {getFileIcon(doc.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{doc.size}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{doc.date}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="hover-scale" onClick={() => handleViewDocument(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="hover-scale"
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
    </div>
  );
}
