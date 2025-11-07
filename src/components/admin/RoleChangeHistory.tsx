import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History, Plus, Minus, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleAuditRecord {
  id: string;
  action: string;
  old_roles: string[] | null;
  new_roles: string[] | null;
  changed_by: string | null;
  ip_address: string | null;
  created_at: string;
  changer_email?: string;
}

interface RoleChangeHistoryProps {
  userId: string;
}

export function RoleChangeHistory({ userId }: RoleChangeHistoryProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["role-audit", userId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("user_role_audit" as any)
        .select(`
          *,
          changer:changed_by(email)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50) as any);

      if (error) {
        console.error("Error fetching role audit:", error);
        return [];
      }

      return (data || []).map((record: any) => ({
        id: record.id,
        action: record.action,
        old_roles: record.old_roles,
        new_roles: record.new_roles,
        changed_by: record.changed_by,
        ip_address: record.ip_address,
        created_at: record.created_at,
        changer_email: record.changer?.email,
      })) as RoleAuditRecord[];
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "add_role":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "remove_role":
        return <Minus className="h-4 w-4 text-red-600" />;
      case "bulk_update":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "add_role":
        return "Rol Agregado";
      case "remove_role":
        return "Rol Removido";
      case "bulk_update":
        return "Actualización Masiva";
      default:
        return action;
    }
  };

  const getRolesDiff = (oldRoles: string[] | null, newRoles: string[] | null) => {
    const old = oldRoles || [];
    const newR = newRoles || [];
    
    const added = newR.filter(r => !old.includes(r));
    const removed = old.filter(r => !newR.includes(r));

    return { added, removed };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios de Roles
          </CardTitle>
          <CardDescription>
            Auditoría de modificaciones de roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios de Roles
          </CardTitle>
          <CardDescription>
            Auditoría de modificaciones de roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay cambios de roles registrados para este usuario
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Cambios de Roles
        </CardTitle>
        <CardDescription>
          Auditoría completa de modificaciones de roles (últimos 50 cambios)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Acción</TableHead>
              <TableHead>Cambios</TableHead>
              <TableHead>Modificado Por</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => {
              const { added, removed } = getRolesDiff(record.old_roles, record.new_roles);
              
              return (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(record.action)}
                      <span className="text-sm font-medium">
                        {getActionLabel(record.action)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 flex-wrap">
                      {added.map(role => (
                        <Badge key={role} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          + {role}
                        </Badge>
                      ))}
                      {removed.map(role => (
                        <Badge key={role} variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                          - {role}
                        </Badge>
                      ))}
                      {added.length === 0 && removed.length === 0 && (
                        <span className="text-sm text-muted-foreground">Sin cambios</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {record.changer_email || "Sistema"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground font-mono">
                      {record.ip_address || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(record.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
