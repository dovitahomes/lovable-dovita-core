import { useCallback, useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useClientDocumentsUpload } from "@/hooks/useClientDocumentsUpload";
import { cn } from "@/lib/utils";

interface UploadDropzoneProps {
  projectId: string;
}

export function UploadDropzone({ projectId }: UploadDropzoneProps) {
  const [uploadingFiles, setUploadingFiles] = useState<
    Map<string, { name: string; progress: number }>
  >(new Map());
  
  const uploadMutation = useClientDocumentsUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newUploading = new Map(uploadingFiles);

      for (const file of acceptedFiles) {
        const fileId = `${file.name}-${Date.now()}`;
        newUploading.set(fileId, { name: file.name, progress: 0 });
        setUploadingFiles(new Map(newUploading));

        try {
          await uploadMutation.mutateAsync({
            projectId,
            file,
            onProgress: (progress) => {
              newUploading.set(fileId, { name: file.name, progress });
              setUploadingFiles(new Map(newUploading));
            },
          });

          // Remove from uploading list after success
          newUploading.delete(fileId);
          setUploadingFiles(new Map(newUploading));
        } catch (error) {
          // Remove from uploading list after error
          newUploading.delete(fileId);
          setUploadingFiles(new Map(newUploading));
        }
      }
    },
    [projectId, uploadMutation, uploadingFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-[hsl(var(--dovita-blue))] bg-blue-50"
            : "border-slate-300 hover:border-[hsl(var(--dovita-blue))] hover:bg-slate-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <div className="flex justify-center">
            {isDragActive ? (
              <FileUp className="h-12 w-12 text-[hsl(var(--dovita-blue))] animate-bounce" />
            ) : (
              <Upload className="h-12 w-12 text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {isDragActive
                ? "Suelta los archivos aquí"
                : "Arrastra archivos o haz clic para seleccionar"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, JPG, PNG, DOCX, XLSX • Máx. 10 MB
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            Seleccionar archivos
          </Button>
        </div>
      </div>

      {/* Upload progress */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([id, file]) => (
            <div
              key={id}
              className="bg-slate-50 rounded-xl p-3 border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-900 truncate flex-1">
                  {file.name}
                </p>
                <span className="text-xs text-slate-500 ml-2">
                  {Math.round(file.progress)}%
                </span>
              </div>
              <Progress value={file.progress} className="h-1.5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
