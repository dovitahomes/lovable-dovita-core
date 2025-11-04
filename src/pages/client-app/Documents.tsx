import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Image as ImageIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentViewer from '@/components/client-app/DocumentViewer';

const documents = {
  cliente: [
    { id: 1, name: 'Escrituras.pdf', size: '3.1 MB', date: '1 Mar 2024', type: 'pdf' },
    { id: 2, name: 'Identificación Oficial.pdf', size: '450 KB', date: '1 Mar 2024', type: 'pdf' },
  ],
  proyecto: [
    { id: 3, name: 'Planos Arquitectónicos.pdf', size: '2.5 MB', date: '15 Mar 2024', type: 'pdf' },
    { id: 4, name: 'Especificaciones Técnicas.pdf', size: '890 KB', date: '8 Mar 2024', type: 'pdf' },
  ],
  legal: [
    { id: 5, name: 'Contrato de Construcción.pdf', size: '2.8 MB', date: '15 Mar 2024', type: 'pdf' },
    { id: 6, name: 'Permiso de Construcción.pdf', size: '1.5 MB', date: '20 Mar 2024', type: 'pdf' },
  ],
  diseno: [
    { id: 7, name: 'Diseño Interior.pdf', size: '4.2 MB', date: '12 Mar 2024', type: 'pdf' },
    { id: 8, name: 'Renders 3D.jpg', size: '2.1 MB', date: '10 Mar 2024', type: 'image' },
    { id: 9, name: 'Paleta de Colores.pdf', size: '650 KB', date: '8 Mar 2024', type: 'pdf' },
  ],
  construccion: [
    { id: 10, name: 'Avance Semana 1.pdf', size: '1.8 MB', date: '22 Mar 2024', type: 'pdf' },
    { id: 11, name: 'Fotos Obra.jpg', size: '3.5 MB', date: '21 Mar 2024', type: 'image' },
    { id: 12, name: 'Bitácora Construcción.pdf', size: '920 KB', date: '20 Mar 2024', type: 'pdf' },
  ]
};

export default function Documents() {
  const [selectedDocument, setSelectedDocument] = useState<{
    name: string;
    type: string;
  } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleViewDocument = (doc: typeof documents.cliente[0]) => {
    setSelectedDocument({
      name: doc.name,
      type: doc.type,
    });
    setViewerOpen(true);
  };

  const renderDocumentList = (docs: typeof documents.cliente) => (
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
    <div className="h-full overflow-y-auto p-4 space-y-4">
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
  );
}
