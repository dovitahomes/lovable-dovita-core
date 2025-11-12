import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Download, Upload, Search, FolderTree, Filter, X } from "lucide-react";
import * as XLSX from 'xlsx';
import { TUTreeNode } from "@/components/TUTreeNode";
import { TUStatsCards } from "@/components/tu/TUStatsCards";
import { TUImportDialog } from "@/components/tu/TUImportDialog";

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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

  const handleInlineUpdate = async (nodeId: string, data: { code: string; name: string; unit_default: string | null }) => {
    try {
      await updateMutation.mutateAsync({ id: nodeId, data });
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleAddChild = async (parentId: string, type: TUNode['type']) => {
    const parent = nodes?.find(n => n.id === parentId);
    if (!parent) return;

    const newNodeData = {
      project_scope: scopeFilter,
      scope_id: null,
      type,
      parent_id: parentId,
      code: '01', // Default code, user will edit inline
      name: `Nuevo ${type}`,
      unit_default: null,
      is_universal: false,
      order_index: 0
    };

    try {
      await createMutation.mutateAsync(newNodeData);
      setExpandedNodes(prev => new Set(prev).add(parentId)); // Auto-expand parent
    } catch (error) {
      // Error already handled by mutation
    }
  };

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
    const wb = XLSX.utils.book_new();

    // Sheet 1: Departamentos
    const departamentos = [
      { 'Código': '01', 'Nombre': 'PRELIMINARES', 'Unidad': '', 'Universal': 'No' },
      { 'Código': '02', 'Nombre': 'CIMENTACIÓN', 'Unidad': '', 'Universal': 'No' },
      { 'Código': '03', 'Nombre': 'ESTRUCTURA', 'Unidad': '', 'Universal': 'No' },
    ];
    const ws1 = XLSX.utils.json_to_sheet(departamentos);
    XLSX.utils.book_append_sheet(wb, ws1, "Departamentos");

    // Sheet 2: Mayores
    const mayores = [
      { 'Código': '01', 'Código Padre': '01', 'Nombre': 'Limpieza', 'Unidad': '', 'Universal': 'No' },
      { 'Código': '02', 'Código Padre': '01', 'Nombre': 'Trazo y Nivelación', 'Unidad': '', 'Universal': 'No' },
      { 'Código': '01', 'Código Padre': '02', 'Nombre': 'Excavación', 'Unidad': '', 'Universal': 'No' },
    ];
    const ws2 = XLSX.utils.json_to_sheet(mayores);
    XLSX.utils.book_append_sheet(wb, ws2, "Mayores");

    // Sheet 3: Partidas
    const partidas = [
      { 'Código': '01', 'Código Padre': '01.01', 'Nombre': 'Limpieza de terreno', 'Unidad': '', 'Universal': 'No' },
      { 'Código': '01', 'Código Padre': '01.02', 'Nombre': 'Trazo con cal', 'Unidad': '', 'Universal': 'No' },
      { 'Código': '01', 'Código Padre': '02.01', 'Nombre': 'Excavación manual', 'Unidad': '', 'Universal': 'No' },
    ];
    const ws3 = XLSX.utils.json_to_sheet(partidas);
    XLSX.utils.book_append_sheet(wb, ws3, "Partidas");

    // Sheet 4: Subpartidas
    const subpartidas = [
      { 'Código': '01', 'Código Padre': '01.01.01', 'Nombre': 'Desmonte manual', 'Unidad': 'm2', 'Universal': 'No' },
      { 'Código': '02', 'Código Padre': '01.01.01', 'Nombre': 'Limpieza con maquinaria', 'Unidad': 'm2', 'Universal': 'No' },
      { 'Código': '01', 'Código Padre': '01.02.01', 'Nombre': 'Trazo con equipo topográfico', 'Unidad': 'm', 'Universal': 'No' },
    ];
    const ws4 = XLSX.utils.json_to_sheet(subpartidas);
    XLSX.utils.book_append_sheet(wb, ws4, "Subpartidas");

    XLSX.writeFile(wb, "plantilla-catalogo-tu.xlsx");
    toast.success("Plantilla descargada con 4 sheets");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportDialogOpen(true);
  };

  const handleConfirmImport = async (rows: any[]) => {
    try {
      for (const row of rows) {
        // Build parent_id by finding parent by codigo
        let parent_id = null;
        
        if (row.parent_codigo) {
          const { data: parentNodes } = await supabase
            .from('tu_nodes')
            .select('id')
            .eq('code', row.parent_codigo)
            .eq('project_scope', scopeFilter)
            .limit(1);
          
          if (parentNodes && parentNodes.length > 0) {
            parent_id = parentNodes[0].id;
          }
        }

        await supabase.from('tu_nodes').insert({
          code: row.codigo,
          name: row.nombre,
          type: row.tipo,
          unit_default: row.unidad || null,
          is_universal: false,
          project_scope: scopeFilter,
          scope_id: null,
          parent_id,
          order_index: 0
        });
      }

      queryClient.invalidateQueries({ queryKey: ['tu_nodes'] });
      queryClient.invalidateQueries({ queryKey: ['tu-stats'] });
      toast.success(`${rows.length} nodos importados exitosamente`);
    } catch (error: any) {
      toast.error("Error al importar: " + error.message);
      throw error;
    }
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
    <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
            <FolderTree className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Transacciones Unificadas</h1>
            <p className="text-sm text-muted-foreground">Gestiona la jerarquía presupuestal</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" /> 
            <span className="hidden sm:inline">Plantilla</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="flex-1 sm:flex-none"
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="flex-1 sm:flex-none"
          >
            <Download className="h-4 w-4 mr-2" /> 
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { resetForm(); setDialogOpen(true); }}
                className="flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4 mr-2" /> Nuevo Nodo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingNode ? 'Editar' : 'Crear'} Nodo TU</DialogTitle>
                <DialogDescription>
                  {editingNode 
                    ? 'Modifica los datos del nodo existente'
                    : 'Crea un nuevo nodo en la jerarquía presupuestal'
                  }
                </DialogDescription>
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

      {/* Stats Cards */}
      <TUStatsCards scopeFilter={scopeFilter} />

      {/* Tree Card */}
      <Card className="border-border/40">
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="w-full sm:w-auto">
              <Select value={scopeFilter} onValueChange={(v: any) => setScopeFilter(v)}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      Global
                    </div>
                  </SelectItem>
                  <SelectItem value="sucursal">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Sucursal
                    </div>
                  </SelectItem>
                  <SelectItem value="proyecto">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      Proyecto
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {searchQuery && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-3 w-3" />
              <span>Buscando: <strong className="text-foreground">{searchQuery}</strong></span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : filteredTree.length > 0 ? (
            <div className="space-y-0.5">
              {filteredTree.map((node, index) => (
                <div 
                  key={node.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TUTreeNode
                    node={node}
                    allNodes={nodes || []}
                    expandedNodes={expandedNodes}
                    onToggle={toggleNode}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onUpdate={handleInlineUpdate}
                    onAddChild={handleAddChild}
                    level={0}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 flex items-center justify-center">
                <FolderTree className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-lg font-medium mb-1">
                {searchQuery ? 'No se encontraron resultados' : 'No hay nodos en este catálogo'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? `Intenta con otro término de búsqueda` 
                  : `Comienza creando el primer nodo de tu jerarquía`
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Nodo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <TUImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleConfirmImport}
        scopeFilter={scopeFilter}
      />
    </div>
  );
}