import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useDesignDeliverables, 
  useUploadDesignDeliverables,
  useSignedUrl,
  useDeleteDeliverable,
  useUpdateDeliverable
} from "@/hooks/useDesignDeliverables";
import { useDesignPhases } from "@/hooks/useDesignPhases";
import { Upload, ExternalLink, Trash2, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeliverablesSectionProps {
  projectId: string;
}

export function DeliverablesSection({ projectId }: DeliverablesSectionProps) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | undefined>();
  const [openUrlId, setOpenUrlId] = useState<string | null>(null);
  
  const { data: deliverables, isLoading } = useDesignDeliverables(projectId);
  const { data: phases } = useDesignPhases(projectId);
  const uploadFiles = useUploadDesignDeliverables(projectId);
  const deleteDeliverable = useDeleteDeliverable();
  const updateDeliverable = useUpdateDeliverable();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFiles.mutate({ files: acceptedFiles, phaseId: selectedPhaseId });
    }
  }, [uploadFiles, selectedPhaseId]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleOpenFile = (deliverable: any) => {
    setOpenUrlId(deliverable.id);
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <Select value={selectedPhaseId} onValueChange={setSelectedPhaseId}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Fase (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin fase</SelectItem>
                {phases?.map(phase => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.phase_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive ? (
                "Suelta los archivos aquí..."
              ) : (
                "Arrastra archivos aquí o haz clic para seleccionar"
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliverables?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay entregables subidos
                  </TableCell>
                </TableRow>
              ) : (
                deliverables?.map((deliverable: any) => (
                  <TableRow key={deliverable.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {deliverable.file_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={deliverable.phase_id || 'unassigned'}
                        onValueChange={(value) => {
                          updateDeliverable.mutate({
                            id: deliverable.id,
                            updates: { phase_id: value === 'unassigned' ? undefined : value }
                          });
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Sin fase</SelectItem>
                          {phases?.map(phase => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.phase_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(deliverable.file_size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(deliverable.created_at), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <SignedUrlButton 
                          fileUrl={deliverable.file_url}
                          fileName={deliverable.file_name}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDeliverable.mutate({
                            id: deliverable.id,
                            fileUrl: deliverable.file_url,
                            projectId
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SignedUrlButton({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
  const { data: signedUrl, isLoading } = useSignedUrl(fileUrl);
  
  const handleOpen = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleOpen}
      disabled={isLoading || !signedUrl}
    >
      <ExternalLink className="h-4 w-4" />
    </Button>
  );
}
