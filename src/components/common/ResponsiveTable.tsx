import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export interface Column<T> {
  header: string;
  key: keyof T;
  render?: (value: any, item: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  keyExtractor, 
  actions,
  emptyMessage = "No hay datos"
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // MOBILE: Cards
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => (
          <Card key={keyExtractor(item)}>
            <CardContent className="p-4 space-y-2">
              {columns
                .filter(col => !col.hideOnMobile)
                .map((col) => (
                  <div key={String(col.key)} className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {col.header}:
                    </span>
                    <span className="text-sm font-medium text-right">
                      {col.render 
                        ? col.render(item[col.key], item) 
                        : String(item[col.key] || '-')
                      }
                    </span>
                  </div>
                ))}
              {actions && (
                <div className="flex justify-end gap-2 pt-2 border-t">
                  {actions(item)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // DESKTOP: Table
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={String(col.key)}>{col.header}</TableHead>
          ))}
          {actions && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={keyExtractor(item)}>
            {columns.map((col) => (
              <TableCell key={String(col.key)}>
                {col.render 
                  ? col.render(item[col.key], item) 
                  : String(item[col.key] || '-')
                }
              </TableCell>
            ))}
            {actions && (
              <TableCell className="text-right">
                {actions(item)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
