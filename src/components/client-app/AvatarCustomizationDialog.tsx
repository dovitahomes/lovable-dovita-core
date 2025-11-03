import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const predefinedAvatars = [
  { id: "avatar1", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Carlos", label: "Hombre 1" },
  { id: "avatar2", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Miguel", label: "Hombre 2" },
  { id: "avatar3", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Roberto", label: "Hombre 3" },
  { id: "avatar4", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Laura", label: "Mujer 1" },
  { id: "avatar5", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Patricia", label: "Mujer 2" },
  { id: "avatar6", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Gabriela", label: "Mujer 3" },
];

interface AvatarCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: { type: "preset" | "custom"; value: string } | null;
  onSave: (avatar: { type: "preset" | "custom"; value: string }) => void;
}

export default function AvatarCustomizationDialog({
  open,
  onOpenChange,
  currentAvatar,
  onSave,
}: AvatarCustomizationDialogProps) {
  const [selectedType, setSelectedType] = useState<"preset" | "custom">(
    currentAvatar?.type || "preset"
  );
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar?.type === "preset" ? currentAvatar.value : "avatar1");
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    currentAvatar?.type === "custom" ? currentAvatar.value : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result as string);
        setSelectedType("custom");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (selectedType === "preset") {
      onSave({ type: "preset", value: selectedAvatar });
    } else if (uploadedImage) {
      onSave({ type: "custom", value: uploadedImage });
    }
    onOpenChange(false);
    toast({
      title: "Avatar actualizado",
      description: "Tu avatar ha sido actualizado correctamente",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              {selectedType === "custom" && uploadedImage ? (
                <AvatarImage src={uploadedImage} />
              ) : (
                <AvatarImage src={predefinedAvatars.find(a => a.id === selectedAvatar)?.url} />
              )}
            </Avatar>
          </div>

          {/* Avatar Selection */}
          <div>
            <h4 className="text-sm font-medium mb-3">Seleccionar Avatar</h4>
            <div className="grid grid-cols-3 gap-3">
              {predefinedAvatars.map((avatar) => {
                const isSelected = selectedType === "preset" && selectedAvatar === avatar.id;
                return (
                  <Button
                    key={avatar.id}
                    variant="outline"
                    className={`h-20 p-2 relative ${
                      isSelected ? "border-primary border-2" : ""
                    }`}
                    onClick={() => {
                      setSelectedAvatar(avatar.id);
                      setSelectedType("preset");
                    }}
                  >
                    {isSelected && (
                      <Check className="absolute top-1 right-1 h-4 w-4 text-primary z-10" />
                    )}
                    <Avatar className="h-full w-full">
                      <AvatarImage src={avatar.url} />
                    </Avatar>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h4 className="text-sm font-medium mb-3">O Subir Imagen</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadedImage ? "Cambiar imagen" : "Subir imagen"}
            </Button>
            {uploadedImage && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Imagen cargada correctamente
              </p>
            )}
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full">
            Guardar Avatar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
