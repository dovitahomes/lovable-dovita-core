import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Edit, Trash2, GripVertical } from "lucide-react";

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
  level: number;
}

export function TUTreeNode({
  node,
  allNodes,
  expandedNodes,
  onToggle,
  onEdit,
  onDelete,
  level
}: TUTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

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
      departamento: { variant: "default" as const, label: "Dep" },
      mayor: { variant: "secondary" as const, label: "May" },
      partida: { variant: "outline" as const, label: "Par" },
      subpartida: { variant: "default" as const, label: "Sub" }
    };
    const badge = config[type as keyof typeof config];
    return <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>;
  };

  const fullCode = getFullCode(node);
  const indentSize = level * 24;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 rounded-lg group transition-colors"
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
          
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-move" />
          
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

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`¿Eliminar "${node.name}"? Esto eliminará también todos sus hijos.`)) {
                onDelete(node.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TUTreeNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}