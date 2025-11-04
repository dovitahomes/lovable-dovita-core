import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Search, Upload, Eye } from "lucide-react";
import DocumentViewer from '@/components/client-app/DocumentViewer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const documents = {
  cliente: [
    { id: 1, name: "Contrato de Obra.pdf", size: "890 KB", date: "1 Oct 2024", type: "pdf" },
    { id: 2, name: "Factura #001.pdf", size: "245 KB", date: "5 Oct 2024", type: "pdf" },
    { id: 3, name: "Factura #002.pdf", size: "238 KB", date: "20 Oct 2024", type: "pdf" },
  ],
  proyecto: [
    { id: 4, name: "Planos Arquitectónicos.pdf", size: "2.4 MB", date: "15 Oct 2024", type: "pdf" },
    { id: 5, name: "Especificaciones Técnicas.pdf", size: "1.8 MB", date: "10 Oct 2024", type: "pdf" },
  ],
  legal: [
    { id: 6, name: "Permiso de Construcción.pdf", size: "1.2 MB", date: "25 Sep 2024", type: "pdf" },
    { id: 7, name: "Licencias.pdf", size: "650 KB", date: "20 Sep 2024", type: "pdf" },
    { id: 8, name: "Póliza de Seguro.pdf", size: "420 KB", date: "15 Sep 2024", type: "pdf" },
  ],
  diseno: [
    { id: 9, name: "Diseño Interior.pdf", size: "4.2 MB", date: "12 Oct 2024", type: "pdf" },
    { id: 10, name: "Renders 3D.jpg", size: "5.2 MB", date: "10 Oct 2024", type: "image" },
    { id: 11, name: "Paleta de Colores.pdf", size: "650 KB", date: "8 Oct 2024", type: "pdf" },
  ],
  construccion: [
    { id: 12, name: "Avance Semana 1.pdf", size: "1.8 MB", date: "22 Oct 2024", type: "pdf" },
    { id: 13, name: "Fotos de Obra.jpg", size: "3.5 MB", date: "21 Oct 2024", type: "image" },
    { id: 14, name: "Bitácora Construcción.pdf", size: "920 KB", date: "20 Oct 2024", type: "pdf" },
  ],
};

export default function DocumentsDesktop() {
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

  const renderDocumentTable = (docs: typeof documents.cliente) => (
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
  );
}
