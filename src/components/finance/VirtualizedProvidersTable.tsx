import { useMemo, useRef, memo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, FileBarChart } from "lucide-react";

interface Provider {
  id: string;
  code_short: string;
  name: string;
  fiscales_json?: { rfc?: string };
  contacto_json?: { email?: string };
  activo: boolean;
}

interface VirtualizedProvidersTableProps {
  providers: Provider[];
  onEdit: (provider: Provider) => void;
  onView: (provider: Provider) => void;
  onViewUsage: (provider: Provider) => void;
  onDelete: (id: string) => void;
}

const ProviderRow = memo(
  ({
    provider,
    onEdit,
    onView,
    onViewUsage,
    onDelete,
  }: {
    provider: Provider;
    onEdit: (provider: Provider) => void;
    onView: (provider: Provider) => void;
    onViewUsage: (provider: Provider) => void;
    onDelete: (id: string) => void;
  }) => {
    return (
      <TableRow>
        <TableCell className="font-mono font-semibold">{provider.code_short}</TableCell>
        <TableCell className="font-medium">{provider.name}</TableCell>
        <TableCell className="font-mono text-sm">{provider.fiscales_json?.rfc || "-"}</TableCell>
        <TableCell className="text-sm">{provider.contacto_json?.email || "-"}</TableCell>
        <TableCell>
          <Badge variant={provider.activo ? "default" : "secondary"}>
            {provider.activo ? "Activo" : "Inactivo"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => onView(provider)} title="Ver detalles">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onViewUsage(provider)} title="Ver uso">
              <FileBarChart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(provider)} title="Editar">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onDelete(provider.id)} title="Desactivar">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

ProviderRow.displayName = "ProviderRow";

export const VirtualizedProvidersTable = memo(
  ({ providers, onEdit, onView, onViewUsage, onDelete }: VirtualizedProvidersTableProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
      count: providers.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 60,
      overscan: 10,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    return (
      <div ref={parentRef} className="overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>RFC</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              <td />
            </tr>
            {virtualItems.map((virtualRow) => {
              const provider = providers[virtualRow.index];
              return (
                <tr
                  key={provider.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ProviderRow
                    provider={provider}
                    onEdit={onEdit}
                    onView={onView}
                    onViewUsage={onViewUsage}
                    onDelete={onDelete}
                  />
                </tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
);

VirtualizedProvidersTable.displayName = "VirtualizedProvidersTable";
