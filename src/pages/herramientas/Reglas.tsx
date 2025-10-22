import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Edit } from "lucide-react";
import { RuleHistoryDialog } from "@/components/rules/RuleHistoryDialog";

export default function Reglas() {
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [filterScope, setFilterScope] = useState<string>("all");
  const [filterKey, setFilterKey] = useState("");

  const { data: ruleSet } = useQuery({
    queryKey: ["default-rule-set"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_rule_sets")
        .select("*")
        .eq("is_default", true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ["business-rules", filterScope, filterKey],
    queryFn: async () => {
      let query = supabase
        .from("business_rules")
        .select("*")
        .order("key");

      if (ruleSet) {
        query = query.eq("rule_set_id", ruleSet.id);
      }

      if (filterScope !== "all") {
        query = query.eq("scope_type", filterScope as "global" | "sucursal" | "proyecto");
      }

      if (filterKey) {
        query = query.ilike("key", `%${filterKey}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!ruleSet,
  });

  const updateRuleMutation = useMutation({
    mutationFn: async (values: any) => {
      const { error } = await supabase
        .from("business_rules")
        .update({
          value_json: values.value_json,
          scope_type: values.scope_type,
          scope_id: values.scope_id || null,
          active_from: values.active_from,
          active_to: values.active_to || null,
        })
        .eq("id", values.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast.success("Regla actualizada");
      setEditDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error: any) => {
      toast.error("Error al actualizar regla: " + error.message);
    },
  });

  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setEditDialogOpen(true);
  };

  const getScopeBadge = (scope: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      global: "default",
      sucursal: "secondary",
      proyecto: "outline",
    };
    return <Badge variant={variants[scope] || "default"}>{scope}</Badge>;
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Centro de Reglas</h1>
            <p className="text-muted-foreground">
              {ruleSet?.name} - {ruleSet?.description}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de Negocio</CardTitle>
          <CardDescription>
            Gestiona las reglas y configuraciones del sistema de forma dinámica
          </CardDescription>
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por clave..."
                value={filterKey}
                onChange={(e) => setFilterKey(e.target.value)}
              />
            </div>
            <Select value={filterScope} onValueChange={setFilterScope}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los scopes</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="sucursal">Sucursal</SelectItem>
                <SelectItem value="proyecto">Proyecto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Valor (JSON)</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Vigencia Desde</TableHead>
                <TableHead>Vigencia Hasta</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules?.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-mono text-sm">{rule.key}</TableCell>
                  <TableCell className="max-w-md">
                    <pre className="text-xs overflow-x-auto bg-muted p-2 rounded">
                      {JSON.stringify(rule.value_json, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell>{getScopeBadge(rule.scope_type)}</TableCell>
                  <TableCell>
                    {new Date(rule.active_from).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell>
                    {rule.active_to
                      ? new Date(rule.active_to).toLocaleDateString("es-MX")
                      : "Sin límite"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <RuleHistoryDialog ruleId={rule.id} ruleKey={rule.key} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!rules?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay reglas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRule && (
        <EditRuleDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          rule={selectedRule}
          onSave={(values) => updateRuleMutation.mutate(values)}
          isPending={updateRuleMutation.isPending}
        />
      )}
    </div>
  );
}

function EditRuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: any;
  onSave: (values: any) => void;
  isPending: boolean;
}) {
  const [valueJson, setValueJson] = useState(JSON.stringify(rule.value_json, null, 2));
  const [scopeType, setScopeType] = useState(rule.scope_type);
  const [scopeId, setScopeId] = useState(rule.scope_id || "");
  const [activeFrom, setActiveFrom] = useState(
    new Date(rule.active_from).toISOString().split("T")[0]
  );
  const [activeTo, setActiveTo] = useState(
    rule.active_to ? new Date(rule.active_to).toISOString().split("T")[0] : ""
  );
  const [jsonError, setJsonError] = useState("");

  const handleSave = () => {
    try {
      const parsed = JSON.parse(valueJson);
      setJsonError("");
      
      onSave({
        id: rule.id,
        value_json: parsed,
        scope_type: scopeType,
        scope_id: scopeId || null,
        active_from: new Date(activeFrom).toISOString(),
        active_to: activeTo ? new Date(activeTo).toISOString() : null,
      });
    } catch (e) {
      setJsonError("JSON inválido. Por favor corrige el formato.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Regla</DialogTitle>
          <DialogDescription>
            Clave: <code className="font-mono text-xs">{rule.key}</code>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="value-json">Valor (JSON)</Label>
            <Textarea
              id="value-json"
              value={valueJson}
              onChange={(e) => {
                setValueJson(e.target.value);
                setJsonError("");
              }}
              className="font-mono text-sm"
              rows={8}
            />
            {jsonError && <p className="text-sm text-destructive mt-1">{jsonError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scope-type">Scope</Label>
              <Select value={scopeType} onValueChange={setScopeType}>
                <SelectTrigger id="scope-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="sucursal">Sucursal</SelectItem>
                  <SelectItem value="proyecto">Proyecto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scopeType !== "global" && (
              <div>
                <Label htmlFor="scope-id">Scope ID (UUID)</Label>
                <Input
                  id="scope-id"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  placeholder="UUID del scope"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="active-from">Vigencia Desde</Label>
              <Input
                id="active-from"
                type="date"
                value={activeFrom}
                onChange={(e) => setActiveFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="active-to">Vigencia Hasta (opcional)</Label>
              <Input
                id="active-to"
                type="date"
                value={activeTo}
                onChange={(e) => setActiveTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
