import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Smile, Camera, Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const predefinedIcons = [
  { id: "user", icon: User, label: "Usuario" },
  { id: "smile", icon: Smile, label: "Sonrisa" },
  { id: "camera", icon: Camera, label: "Cámara" },
];

interface AvatarCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatar: { type: "icon" | "image"; value: string } | null;
  onSave: (avatar: { type: "icon" | "image"; value: string }) => void;
}

export default function AvatarCustomizationDialog({
  open,
  onOpenChange,
  currentAvatar,
  onSave,
}: AvatarCustomizationDialogProps) {
  const [selectedType, setSelectedType] = useState<"icon" | "image">(
    currentAvatar?.type || "icon"
  );
  const [selectedIcon, setSelectedIcon] = useState(currentAvatar?.type === "icon" ? currentAvatar.value : "user");
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    currentAvatar?.type === "image" ? currentAvatar.value : null
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
        setSelectedType("image");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (selectedType === "icon") {
      onSave({ type: "icon", value: selectedIcon });
    } else if (uploadedImage) {
      onSave({ type: "image", value: uploadedImage });
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
              {selectedType === "image" && uploadedImage ? (
                <img src={uploadedImage} alt="Avatar" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  {(() => {
                    const IconComponent = predefinedIcons.find(i => i.id === selectedIcon)?.icon || User;
                    return <IconComponent className="h-12 w-12 text-primary" />;
                  })()}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          {/* Icon Selection */}
          <div>
            <h4 className="text-sm font-medium mb-3">Seleccionar Ícono</h4>
            <div className="grid grid-cols-3 gap-3">
              {predefinedIcons.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedType === "icon" && selectedIcon === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="outline"
                    className={`h-20 flex flex-col gap-2 relative ${
                      isSelected ? "border-primary border-2" : ""
                    }`}
                    onClick={() => {
                      setSelectedIcon(item.id);
                      setSelectedType("icon");
                    }}
                  >
                    {isSelected && (
                      <Check className="absolute top-1 right-1 h-4 w-4 text-primary" />
                    )}
                    <IconComponent className="h-6 w-6" />
                    <span className="text-xs">{item.label}</span>
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
