import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface TUNode {
  id: string;
  type: 'departamento' | 'mayor' | 'partida' | 'subpartida';
  code: string;
  name: string;
  unit_default: string | null;
  is_universal: boolean;
}

interface TUNodeInlineEditProps {
  node: TUNode;
  onSave: (data: { code: string; name: string; unit_default: string | null }) => void;
  onCancel: () => void;
  level: number;
  autoSaveOnBlur?: boolean;
}

const nodeSchema = z.object({
  code: z.string().trim().min(1, "Código requerido").max(10, "Máximo 10 caracteres"),
  name: z.string().trim().min(1, "Nombre requerido").max(255, "Máximo 255 caracteres"),
  unit_default: z.string().max(20, "Máximo 20 caracteres").optional()
});

export function TUNodeInlineEdit({ 
  node, 
  onSave, 
  onCancel,
  level,
  autoSaveOnBlur = false
}: TUNodeInlineEditProps) {
  const [formData, setFormData] = useState({
    code: node.code,
    name: node.name,
    unit_default: node.unit_default || ''
  });
  
  const [errors, setErrors] = useState<{ code?: string; name?: string; unit_default?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const codeInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-focus code input on mount
    codeInputRef.current?.focus();
    codeInputRef.current?.select();

    // Detect clicks outside for auto-save
    if (autoSaveOnBlur) {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          if (hasChanges && !isSaving && Object.keys(errors).length === 0) {
            handleSave();
          } else if (!hasChanges) {
            onCancel();
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [autoSaveOnBlur, hasChanges, isSaving, errors]);

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    validateField(field, value);
  };

  const validateField = (field: keyof typeof formData, value: string) => {
    try {
      const partialSchema = z.object({
        [field]: field === 'unit_default' 
          ? z.string().max(20, "Máximo 20 caracteres").optional()
          : z.string().trim().min(1, `${field === 'code' ? 'Código' : 'Nombre'} requerido`).max(field === 'code' ? 10 : 255)
      });
      
      partialSchema.parse({ [field]: value });
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
        return false;
      }
      return false;
    }
  };

  const handleSave = async () => {
    // Validate all fields
    const validation = nodeSchema.safeParse({
      code: formData.code,
      name: formData.name,
      unit_default: formData.unit_default || undefined
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        code: formData.code.trim(),
        name: formData.name.trim(),
        unit_default: formData.unit_default.trim() || null
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab' && e.currentTarget === codeInputRef.current) {
      e.preventDefault();
      nameInputRef.current?.focus();
    }
  };

  const getTypeBadge = (type: string) => {
    const config = {
      departamento: { 
        label: "DEP",
        className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
      },
      mayor: { 
        label: "MAY",
        className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      },
      partida: { 
        label: "PAR",
        className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
      },
      subpartida: { 
        label: "SUB",
        className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      }
    };
    const badge = config[type as keyof typeof config];
    return (
      <Badge variant="default" className={cn("text-xs font-semibold", badge.className)}>
        {badge.label}
      </Badge>
    );
  };

  const indentSize = level * 24;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-2 py-2.5 px-3 bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-lg animate-scale-in"
      style={{ paddingLeft: `${indentSize + 12}px` }}
    >
      <div className="flex items-center gap-2 flex-1">
        <div className="w-5" /> {/* Spacer for expand icon */}
        
        {getTypeBadge(node.type)}
        
        {/* Code Input */}
        <div className="relative">
          <Input
            ref={codeInputRef}
            value={formData.code}
            onChange={(e) => handleFieldChange('code', e.target.value)}
            onBlur={() => validateField('code', formData.code)}
            onKeyDown={handleKeyDown}
            placeholder="Código"
            className={cn(
              "h-8 w-24 font-mono text-sm font-semibold",
              errors.code && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.code && (
            <div className="absolute top-full left-0 mt-1 text-xs text-destructive flex items-center gap-1 whitespace-nowrap z-10">
              <AlertCircle className="h-3 w-3" />
              {errors.code}
            </div>
          )}
        </div>

        {/* Name Input */}
        <div className="relative flex-1">
          <Input
            ref={nameInputRef}
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={() => validateField('name', formData.name)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del nodo"
            className={cn(
              "h-8 font-medium",
              errors.name && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.name && (
            <div className="absolute top-full left-0 mt-1 text-xs text-destructive flex items-center gap-1 whitespace-nowrap z-10">
              <AlertCircle className="h-3 w-3" />
              {errors.name}
            </div>
          )}
        </div>

        {/* Unit Input (optional) */}
        <div className="relative">
          <Input
            value={formData.unit_default}
            onChange={(e) => handleFieldChange('unit_default', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Unidad"
            className={cn(
              "h-8 w-20 text-sm",
              errors.unit_default && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.unit_default && (
            <div className="absolute top-full right-0 mt-1 text-xs text-destructive flex items-center gap-1 whitespace-nowrap z-10">
              <AlertCircle className="h-3 w-3" />
              {errors.unit_default}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || hasErrors}
          className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600 text-white"
        >
          {isSaving ? (
            <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
