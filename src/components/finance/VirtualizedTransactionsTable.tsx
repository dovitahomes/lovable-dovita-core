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
import { TrendingUp, TrendingDown } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  type: string;
  concept: string;
  bank_accounts?: { numero_cuenta: string };
  clients?: { name: string };
  providers?: { name: string };
  amount: number;
  currency: string;
}

interface VirtualizedTransactionsTableProps {
  transactions: Transaction[];
}

const TransactionRow = memo(({ transaction }: { transaction: Transaction }) => {
  const isIncome = transaction.type === "ingreso";
  
  return (
    <TableRow>
      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
      <TableCell>
        <Badge variant={isIncome ? "default" : "secondary"} className="gap-1">
          {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isIncome ? "Ingreso" : "Egreso"}
        </Badge>
      </TableCell>
      <TableCell>{transaction.concept}</TableCell>
      <TableCell className="font-mono text-sm">
        {transaction.bank_accounts?.numero_cuenta || "-"}
      </TableCell>
      <TableCell>{transaction.clients?.name || transaction.providers?.name || "-"}</TableCell>
      <TableCell className={`text-right font-semibold ${isIncome ? "text-green-600" : "text-red-600"}`}>
        {isIncome ? "+" : "-"}${transaction.amount.toLocaleString()} {transaction.currency}
      </TableCell>
    </TableRow>
  );
});

TransactionRow.displayName = "TransactionRow";

export const VirtualizedTransactionsTable = memo(({ transactions }: VirtualizedTransactionsTableProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
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
            <TableHead>Fecha</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Concepto</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Cliente/Proveedor</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <td />
          </tr>
          {virtualItems.map((virtualRow) => {
            const transaction = transactions[virtualRow.index];
            return (
              <tr
                key={transaction.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TransactionRow transaction={transaction} />
              </tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
});

VirtualizedTransactionsTable.displayName = "VirtualizedTransactionsTable";
