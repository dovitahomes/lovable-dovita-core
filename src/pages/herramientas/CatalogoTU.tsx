import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Download, Upload, Search, ChevronRight, ChevronDown, Edit, Trash2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { TUTreeNode } from "@/components/TUTreeNode";

interface TUNode {
  id: string;
  project_scope: 'global' | 'sucursal' | 'proyecto';
  scope_id: string | null;
  type: 'departamento' | 'mayor' | 'partida' | 'subpartida';
  parent_id: string | null;
  code: string;
  name: string;
  order_index: number;
  unit_default: string | null;
  is_universal: boolean;
  children?: TUNode[];
}

export default function CatalogoTU() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<TUNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<'global' | 'sucursal' | 'proyecto'>('global');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    type: 'departamento' as TUNode['type'],
    parent_id: null as string | null,
    code: '',
    name: '',
    unit_default: '',
    is_universal: false
  });

  const queryClient = useQueryClient();

  const { data: nodes, isLoading } = useQuery({
    queryKey: ['tu_nodes', scopeFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('project_scope', scopeFilter)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as TUNode[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('tu_nodes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tu_nodes'] });
      toast.success("Nodo creado exitosamente");
      resetForm();
    },
    onError: (error: any) => toast.error("Error al crear: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('tu_nodes').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tu_nodes'] });
      toast.success("Nodo actualizado");
      resetForm();
    },
    onError: (error: any) => toast.error("Error al actualizar: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tu_nodes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tu_nodes'] });
      toast.success("Nodo eliminado");
    },
    onError: (error: any) => toast.error("Error al eliminar: " + error.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      project_scope: scopeFilter,
      scope_id: null,
      type: formData.type,
      parent_id: formData.parent_id,
      code: formData.code,
      name: formData.name,
      unit_default: formData.unit_default || null,
      is_universal: formData.is_universal,
      order_index: 0
    };

    if (editingNode) {
      updateMutation.mutate({ id: editingNode.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'departamento',
      parent_id: null,
      code: '',
      name: '',
      unit_default: '',
      is_universal: false
    });
    setEditingNode(null);
    setDialogOpen(false);
  };

  const handleEdit = (node: TUNode) => {
    setEditingNode(node);
    setFormData({
      type: node.type,
      parent_id: node.parent_id,
      code: node.code,
      name: node.name,
      unit_default: node.unit_default || '',
      is_universal: node.is_universal
    });
    setDialogOpen(true);
  };

  const buildTree = (nodes: TUNode[]): TUNode[] => {
    const nodeMap = new Map<string, TUNode>();
    const roots: TUNode[] = [];

    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach(node => {
      const currentNode = nodeMap.get(node.id)!;
      if (node.parent_id) {
        const parent = nodeMap.get(node.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(currentNode);
        }
      } else {
        roots.push(currentNode);
      }
    });

    return roots;
  };

  const getFullCode = (node: TUNode, allNodes: TUNode[]): string => {
    const codes: string[] = [];
    let current: TUNode | undefined = node;

    while (current) {
      codes.unshift(current.code);
      current = allNodes.find(n => n.id === current!.parent_id);
    }

    return codes.join('.');
  };

  const handleExport = () => {
    if (!nodes) return;

    const exportData = nodes.map(node => ({
      'Código': node.code,
      'Código Completo': getFullCode(node, nodes),
      'Nombre': node.name,
      'Tipo': node.type,
      'Unidad': node.unit_default || '',
      'Universal': node.is_universal ? 'Sí' : 'No',
      'Scope': node.project_scope
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catálogo TU");
    XLSX.writeFile(wb, `catalogo-tu-${scopeFilter}-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Catálogo exportado");
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        'Código': '01',
        'Nombre': 'PRELIMINARES',
        'Tipo': 'departamento',
        'ID Padre': '',
        'Unidad': '',
        'Universal': 'No'
      },
      {
        'Código': '01',
        'Nombre': 'Limpieza',
        'Tipo': 'mayor',
        'ID Padre': '01',
        'Unidad': '',
        'Universal': 'No'
      },
      {
        'Código': '01',
        'Nombre': 'Limpieza de terreno',
        'Tipo': 'partida',
        'ID Padre': '01.01',
        'Unidad': '',
        'Universal': 'No'
      },
      {
        'Código': '01',
        'Nombre': 'Desmonte manual',
        'Tipo': 'subpartida',
        'ID Padre': '01.01.01',
        'Unidad': 'm2',
        'Universal': 'No'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    XLSX.writeFile(wb, "plantilla-catalogo-tu.xlsx");
    toast.success("Plantilla descargada");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process and import nodes
        for (const row of jsonData as any[]) {
          await supabase.from('tu_nodes').insert({
            code: row['Código'],
            name: row['Nombre'],
            type: row['Tipo'],
            unit_default: row['Unidad'] || null,
            is_universal: row['Universal'] === 'Sí',
            project_scope: scopeFilter,
            scope_id: null,
            order_index: 0
          });
        }

        queryClient.invalidateQueries({ queryKey: ['tu_nodes'] });
        toast.success("Catálogo importado exitosamente");
      } catch (error: any) {
        toast.error("Error al importar: " + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const treeData = nodes ? buildTree(nodes) : [];
  const filteredTree = searchQuery
    ? treeData.filter(node => 
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : treeData;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Catálogo de Transacciones Unificadas (TU)</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" /> Plantilla
          </Button>
          <label>
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" /> Importar
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Nuevo Nodo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingNode ? 'Editar' : 'Crear'} Nodo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="mayor">Mayor</SelectItem>
                      <SelectItem value="partida">Partida</SelectItem>
                      <SelectItem value="subpartida">Subpartida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="Ej: 01"
                  />
                </div>
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Unidad por defecto</Label>
                  <Input
                    value={formData.unit_default}
                    onChange={(e) => setFormData({ ...formData, unit_default: e.target.value })}
                    placeholder="m2, m3, kg, pza, etc."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.is_universal}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_universal: checked as boolean })}
                  />
                  <label className="text-sm">Concepto Universal (.u)</label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{editingNode ? 'Actualizar' : 'Crear'}</Button>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <Select value={scopeFilter} onValueChange={(v: any) => setScopeFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="sucursal">Sucursal</SelectItem>
                  <SelectItem value="proyecto">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Cargando...</div>
          ) : filteredTree.length > 0 ? (
            <div className="space-y-1">
              {filteredTree.map(node => (
                <TUTreeNode
                  key={node.id}
                  node={node}
                  allNodes={nodes || []}
                  expandedNodes={expandedNodes}
                  onToggle={toggleNode}
                  onEdit={handleEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  level={0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay nodos en este catálogo</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}