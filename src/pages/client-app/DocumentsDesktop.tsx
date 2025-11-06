import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Search, Upload, Eye } from "lucide-react";
import DocumentViewer from '@/components/client-app/DocumentViewer';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useDataSource } from '@/contexts/client-app/DataSourceContext';
import PreviewBar from '@/components/client-app/PreviewBar';
import type { Document } from '@/lib/client-app/client-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DocumentsDesktop() {
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

  const renderDocumentTable = (docs: Document[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Tamaño</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                {doc.name}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{doc.type}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{doc.size}</TableCell>
            <TableCell className="text-muted-foreground">{doc.date}</TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <PreviewBar />
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Documentos</h1>
          <p className="text-muted-foreground">Todos los documentos de tu proyecto</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Subir Documento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar documentos..." className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cliente" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="proyecto">Proyecto</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
              <TabsTrigger value="diseno">Diseño</TabsTrigger>
              <TabsTrigger value="construccion">Construcción</TabsTrigger>
            </TabsList>
            <TabsContent value="cliente" className="mt-6">
              {renderDocumentTable(documents.cliente)}
            </TabsContent>
            <TabsContent value="proyecto" className="mt-6">
              {renderDocumentTable(documents.proyecto)}
            </TabsContent>
            <TabsContent value="legal" className="mt-6">
              {renderDocumentTable(documents.legal)}
            </TabsContent>
            <TabsContent value="diseno" className="mt-6">
              {renderDocumentTable(documents.diseno)}
            </TabsContent>
            <TabsContent value="construccion" className="mt-6">
              {renderDocumentTable(documents.construccion)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DocumentViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        document={selectedDocument}
      />
      </div>
    </div>
  );
}
