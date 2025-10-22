import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History } from "lucide-react";

export function RuleHistoryDialog({ ruleId, ruleKey }: { ruleId: string; ruleKey: string }) {
  const [open, setOpen] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ["rule-history", ruleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_rule_changes")
        .select(`
          *,
          profiles:changed_by (full_name)
        `)
        .eq("rule_id", ruleId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Historial de Cambios</DialogTitle>
          <DialogDescription>
            Regla: <code className="font-mono text-xs">{ruleKey}</code>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div>Cargando historial...</div>
          ) : !history?.length ? (
            <div className="text-center text-muted-foreground py-8">
              No hay cambios registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Valor Anterior</TableHead>
                  <TableHead>Valor Nuevo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {new Date(entry.changed_at).toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell>{entry.profiles?.full_name || "Sistema"}</TableCell>
                    <TableCell>
                      <pre className="text-xs overflow-x-auto bg-muted p-2 rounded max-w-xs">
                        {JSON.stringify(entry.old_value_json, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs overflow-x-auto bg-muted p-2 rounded max-w-xs">
                        {JSON.stringify(entry.new_value_json, null, 2)}
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
