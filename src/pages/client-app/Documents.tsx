import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Image as ImageIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentViewer from '@/components/client-app/DocumentViewer';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import PreviewBar from '@/components/client-app/PreviewBar';
import type { Document } from '@/lib/client-app/client-data';

export default function Documents() {
  const { currentProject } = useProject();
  const { isPreviewMode } = useDataSource();
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Group documents by category
  const documents = {
    cliente: currentProject?.documents.filter(d => d.category === 'cliente') || [],
    proyecto: currentProject?.documents.filter(d => d.category === 'proyecto') || [],
    legal: currentProject?.documents.filter(d => d.category === 'legal') || [],
    diseno: currentProject?.documents.filter(d => d.category === 'diseno') || [],
    construccion: currentProject?.documents.filter(d => d.category === 'construccion') || [],
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument({
      name: doc.name,
      type: doc.type,
    });
    setViewerOpen(true);
  };

  const renderDocumentList = (docs: Document[]) => (
    <div className="space-y-2">
      {docs.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {doc.type === 'pdf' ? (
                  <FileText className="h-5 w-5 text-primary" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{doc.size}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{doc.date}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => handleViewDocument(doc)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Documentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Accede a todos los documentos de tu proyecto
        </p>
      </div>

      <Tabs defaultValue="cliente" className="w-full">
        <TabsList className="h-auto flex flex-wrap gap-1 p-1">
          <TabsTrigger value="cliente" className="flex-1 min-w-[30%]">Cliente</TabsTrigger>
          <TabsTrigger value="proyecto" className="flex-1 min-w-[30%]">Proyecto</TabsTrigger>
          <TabsTrigger value="legal" className="flex-1 min-w-[30%]">Legal</TabsTrigger>
          <TabsTrigger value="diseno" className="flex-1 min-w-[45%]">Diseño</TabsTrigger>
          <TabsTrigger value="construccion" className="flex-1 min-w-[45%]">Construcción</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cliente" className="mt-4">
          {renderDocumentList(documents.cliente)}
        </TabsContent>
        
        <TabsContent value="proyecto" className="mt-4">
          {renderDocumentList(documents.proyecto)}
        </TabsContent>
        
        <TabsContent value="legal" className="mt-4">
          {renderDocumentList(documents.legal)}
        </TabsContent>
        
        <TabsContent value="diseno" className="mt-4">
          {renderDocumentList(documents.diseno)}
        </TabsContent>
        
        <TabsContent value="construccion" className="mt-4">
          {renderDocumentList(documents.construccion)}
        </TabsContent>
      </Tabs>

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
      </div>
    </div>
  );
}
