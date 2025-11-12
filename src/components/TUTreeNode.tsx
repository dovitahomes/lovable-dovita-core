import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Edit, Trash2, GripVertical, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TUNodeInlineEdit } from "@/components/tu/TUNodeInlineEdit";

interface TUNode {
  id: string;
  type: 'departamento' | 'mayor' | 'partida' | 'subpartida';
  parent_id: string | null;
  code: string;
  name: string;
  unit_default: string | null;
  is_universal: boolean;
  children?: TUNode[];
}

interface TUTreeNodeProps {
  node: TUNode;
  allNodes: TUNode[];
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onEdit: (node: TUNode) => void;
  onDelete: (nodeId: string) => void;
  onUpdate: (nodeId: string, data: { code: string; name: string; unit_default: string | null }) => void;
  onAddChild: (parentId: string, type: TUNode['type']) => void;
  level: number;
}

export function TUTreeNode({
  node,
  allNodes,
  expandedNodes,
  onToggle,
  onEdit,
  onDelete,
  onUpdate,
  onAddChild,
  level
}: TUTreeNodeProps) {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  const handleSaveInline = async (data: { code: string; name: string; unit_default: string | null }) => {
    await onUpdate(node.id, data);
    setIsEditingInline(false);
  };

  const getNextChildType = (parentType: TUNode['type']): TUNode['type'] | null => {
    const hierarchy: TUNode['type'][] = ['departamento', 'mayor', 'partida', 'subpartida'];
    const currentIndex = hierarchy.indexOf(parentType);
    return currentIndex < hierarchy.length - 1 ? hierarchy[currentIndex + 1] : null;
  };

  const canAddChild = getNextChildType(node.type) !== null;

  const getFullCode = (currentNode: TUNode): string => {
    const codes: string[] = [];
    let current: TUNode | undefined = currentNode;

    while (current) {
      const code = current.is_universal ? `${current.code}.u` : current.code;
      codes.unshift(code);
      current = allNodes.find(n => n.id === current!.parent_id);
    }

    return codes.join('.');
  };

  const getTypeBadge = (type: string) => {
    const config = {
      departamento: { 
        variant: "default" as const, 
        label: "DEP",
        className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
      },
      mayor: { 
        variant: "default" as const, 
        label: "MAY",
        className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      },
      partida: { 
        variant: "default" as const, 
        label: "PAR",
        className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20"
      },
      subpartida: { 
        variant: "default" as const, 
        label: "SUB",
        className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      }
    };
    const badge = config[type as keyof typeof config];
    return (
      <Badge 
        variant={badge.variant} 
        className={cn("text-xs font-semibold", badge.className)}
      >
        {badge.label}
      </Badge>
    );
  };

  const fullCode = getFullCode(node);
  const indentSize = level * 24;

  const getGradientByType = (type: string) => {
    const gradients = {
      departamento: "hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent",
      mayor: "hover:bg-gradient-to-r hover:from-green-500/5 hover:to-transparent",
      partida: "hover:bg-gradient-to-r hover:from-orange-500/5 hover:to-transparent",
      subpartida: "hover:bg-gradient-to-r hover:from-red-500/5 hover:to-transparent"
    };
    return gradients[type as keyof typeof gradients];
  };

  // If editing inline, show edit component
  if (isEditingInline) {
    return (
      <TUNodeInlineEdit
        node={node}
        onSave={handleSaveInline}
        onCancel={() => setIsEditingInline(false)}
        level={level}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        className={cn(
          "flex items-center gap-2 py-2.5 px-3 rounded-lg group transition-all duration-200",
          "border border-transparent hover:border-border/40",
          "hover:shadow-sm",
          getGradientByType(node.type)
        )}
        style={{ paddingLeft: `${indentSize + 12}px` }}
      >
        <div className="flex items-center gap-2 flex-1">
          {hasChildren ? (
            <button
              onClick={() => onToggle(node.id)}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-move hover:text-primary" />
          
          {getTypeBadge(node.type)}
          
          <code className="font-mono text-sm font-semibold text-primary">
            {fullCode}
          </code>
          
          <span className="flex-1 font-medium">{node.name}</span>
          
          {node.unit_default && (
            <span className="text-sm text-muted-foreground">
              [{node.unit_default}]
            </span>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {canAddChild && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-600"
              onClick={() => {
                const childType = getNextChildType(node.type);
                if (childType) {
                  onAddChild(node.id, childType);
                  if (!isExpanded) onToggle(node.id); // Auto-expand parent
                }
              }}
              title={`Agregar ${getNextChildType(node.type)}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsEditingInline(true)}
            title="Editar inline"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              if (confirm(`¿Eliminar "${node.name}"? Esto eliminará también todos sus hijos.`)) {
                onDelete(node.id);
              }
            }}
            title="Eliminar nodo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, index) => (
            <div 
              key={child.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <TUTreeNode
                node={child}
                allNodes={allNodes}
                expandedNodes={expandedNodes}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onAddChild={onAddChild}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}