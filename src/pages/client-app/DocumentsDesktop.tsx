import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Search, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const documents = {
  proyecto: [
    { id: 1, name: "Planos Arquitectónicos", size: "2.4 MB", date: "15 Oct 2024", type: "PDF" },
    { id: 2, name: "Especificaciones Técnicas", size: "1.8 MB", date: "10 Oct 2024", type: "PDF" },
    { id: 3, name: "Renders 3D", size: "5.2 MB", date: "8 Oct 2024", type: "ZIP" },
  ],
  cliente: [
    { id: 4, name: "Contrato de Obra", size: "890 KB", date: "1 Oct 2024", type: "PDF" },
    { id: 5, name: "Factura #001", size: "245 KB", date: "5 Oct 2024", type: "PDF" },
    { id: 6, name: "Factura #002", size: "238 KB", date: "20 Oct 2024", type: "PDF" },
  ],
  legal: [
    { id: 7, name: "Permiso de Construcción", size: "1.2 MB", date: "25 Sep 2024", type: "PDF" },
    { id: 8, name: "Licencias", size: "650 KB", date: "20 Sep 2024", type: "PDF" },
    { id: 9, name: "Póliza de Seguro", size: "420 KB", date: "15 Sep 2024", type: "PDF" },
  ],
};

export default function DocumentsDesktop() {
  const renderDocumentTable = (docs: typeof documents.proyecto) => (
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
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
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
          <Tabs defaultValue="proyecto" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="proyecto">Proyecto</TabsTrigger>
              <TabsTrigger value="cliente">Cliente</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>
            <TabsContent value="proyecto" className="mt-6">
              {renderDocumentTable(documents.proyecto)}
            </TabsContent>
            <TabsContent value="cliente" className="mt-6">
              {renderDocumentTable(documents.cliente)}
            </TabsContent>
            <TabsContent value="legal" className="mt-6">
              {renderDocumentTable(documents.legal)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
