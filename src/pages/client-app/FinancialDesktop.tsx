import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockMinistraciones } from "@/lib/client-data";
import { useProject } from "@/contexts/ProjectContext";
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function FinancialDesktop() {
  const { currentProject } = useProject();
  const project = currentProject;
  
  // Filter payments by current project
  const payments = mockMinistraciones.filter(m => m.projectId === project?.id);
  
  if (!project) {
    return <div className="h-full flex items-center justify-center">Cargando datos financieros...</div>;
  }
  
  const remaining = project.totalAmount - project.totalPaid;
  const percentSpent = (project.totalPaid / project.totalAmount) * 100;

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div>
        <h1 className="text-3xl font-bold mb-2">Información Financiera</h1>
        <p className="text-muted-foreground">Gestión de pagos y presupuesto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${project.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Costo total del proyecto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastado</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${project.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{percentSpent.toFixed(1)}% del presupuesto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restante</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${remaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{(100 - percentSpent).toFixed(1)}% disponible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,000</div>
            <p className="text-xs text-muted-foreground mt-1">Vence el 20 Nov 2024</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso del Presupuesto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Gastado: ${project.totalPaid.toLocaleString()}</span>
              <span className="text-muted-foreground">{percentSpent.toFixed(1)}%</span>
            </div>
            <Progress value={percentSpent} className="h-3" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>$0</span>
              <span>${project.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.date}</TableCell>
                  <TableCell>{payment.concept}</TableCell>
                  <TableCell className="font-bold">${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "paid" ? "default" : payment.status === "pending" ? "secondary" : "outline"}>
                      {payment.status === "paid" ? "Pagado" : payment.status === "pending" ? "Pendiente" : "Futuro"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">Transferencia</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
