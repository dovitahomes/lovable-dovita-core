import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMailchimpMetrics } from "@/hooks/useMailchimpMetrics";
import { RefreshCw, Mail, MousePointerClick, AlertCircle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function MailchimpMetrics() {
  const { campaigns, summary, isLoading, syncMetrics, isSyncing } = useMailchimpMetrics();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métricas de Mailchimp</h1>
          <p className="text-muted-foreground">
            Seguimiento de campañas enviadas y estadísticas de engagement
          </p>
        </div>
        <Button 
          onClick={() => syncMetrics(undefined)}
          disabled={isSyncing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      {/* Resumen de métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSent}</div>
            <p className="text-xs text-muted-foreground">
              Total de campañas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aperturas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOpens}</div>
            <p className="text-xs text-muted-foreground">
              {summary.avgOpenRate.toFixed(1)}% tasa promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              {summary.avgClickRate.toFixed(1)}% tasa promedio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rebotes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBounces}</div>
            <p className="text-xs text-muted-foreground">
              Emails no entregados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de campañas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Campañas</CardTitle>
          <CardDescription>
            Detalle de todas las campañas enviadas via Mailchimp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No hay campañas registradas</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Destinatario</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead className="text-center">Aperturas</TableHead>
                    <TableHead className="text-center">Clics</TableHead>
                    <TableHead className="text-center">Rebotes</TableHead>
                    <TableHead>Última Sincronización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {campaign.subject}
                      </TableCell>
                      <TableCell>{campaign.email_to}</TableCell>
                      <TableCell>
                        {format(new Date(campaign.sent_at), "PPp", { locale: es })}
                      </TableCell>
                      <TableCell className="text-center">{campaign.opens}</TableCell>
                      <TableCell className="text-center">{campaign.clicks}</TableCell>
                      <TableCell className="text-center">{campaign.bounces}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {campaign.last_synced_at 
                          ? format(new Date(campaign.last_synced_at), "PPp", { locale: es })
                          : "No sincronizado"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
