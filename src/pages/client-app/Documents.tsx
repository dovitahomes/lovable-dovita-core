import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const documents = {
  arquitectonico: [
    { id: 1, name: 'Planos Arquitectónicos.pdf', size: '2.5 MB', date: '15 Mar 2024', type: 'pdf' },
    { id: 2, name: 'Render Principal.jpg', size: '1.2 MB', date: '10 Mar 2024', type: 'image' },
    { id: 3, name: 'Especificaciones Técnicas.pdf', size: '890 KB', date: '8 Mar 2024', type: 'pdf' },
  ],
  cliente: [
    { id: 4, name: 'Escrituras.pdf', size: '3.1 MB', date: '1 Mar 2024', type: 'pdf' },
    { id: 5, name: 'Identificación Oficial.pdf', size: '450 KB', date: '1 Mar 2024', type: 'pdf' },
  ],
  legal: [
    { id: 6, name: 'Contrato de Construcción.pdf', size: '2.8 MB', date: '15 Mar 2024', type: 'pdf' },
    { id: 7, name: 'Permiso de Construcción.pdf', size: '1.5 MB', date: '20 Mar 2024', type: 'pdf' },
  ]
};

export default function Documents() {
  const renderDocumentList = (docs: typeof documents.arquitectonico) => (
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
              
              <Button size="icon" variant="ghost">
                <Download className="h-4 w-4" />
              </Button>
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

      <Tabs defaultValue="arquitectonico" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="arquitectonico">Proyecto</TabsTrigger>
          <TabsTrigger value="cliente">Cliente</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>
        
        <TabsContent value="arquitectonico" className="mt-4">
          {renderDocumentList(documents.arquitectonico)}
        </TabsContent>
        
        <TabsContent value="cliente" className="mt-4">
          {renderDocumentList(documents.cliente)}
        </TabsContent>
        
        <TabsContent value="legal" className="mt-4">
          {renderDocumentList(documents.legal)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
