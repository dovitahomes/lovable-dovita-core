import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMailchimpTemplates } from "@/hooks/useMailchimpTemplates";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

interface MailchimpTemplateSelectorProps {
  onTemplateSelect: (html: string) => void;
  disabled?: boolean;
}

export function MailchimpTemplateSelector({ onTemplateSelect, disabled }: MailchimpTemplateSelectorProps) {
  const { templates, isLoading, getTemplateContent } = useMailchimpTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) {
      toast.error("Selecciona un template primero");
      return;
    }

    setIsLoadingContent(true);
    try {
      const content = await getTemplateContent(selectedTemplateId);
      onTemplateSelect(content.html || "");
      toast.success("Template cargado correctamente");
    } catch (error: any) {
      console.error("Error loading template:", error);
      toast.error(`Error al cargar template: ${error.message}`);
    } finally {
      setIsLoadingContent(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando templates...
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        No hay templates disponibles
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="mailchimp-template">Template de Mailchimp (opcional)</Label>
      <div className="flex gap-2">
        <Select
          value={selectedTemplateId}
          onValueChange={setSelectedTemplateId}
          disabled={disabled || isLoadingContent}
        >
          <SelectTrigger id="mailchimp-template" className="flex-1">
            <SelectValue placeholder="Selecciona un template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          onClick={handleLoadTemplate}
          disabled={!selectedTemplateId || disabled || isLoadingContent}
        >
          {isLoadingContent ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            "Cargar"
          )}
        </Button>
      </div>
    </div>
  );
}
