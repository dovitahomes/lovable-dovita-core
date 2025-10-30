import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Handshake, Users, Eye } from "lucide-react";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { KpiCards } from "@/components/kpi/KpiCards";
import { KpiCharts } from "@/components/kpi/KpiCharts";
import { KpiFilters } from "@/components/kpi/KpiFilters";

const Dashboard = () => {
  // Temporarily show all features - permissions will be restored in Prompt 2
  const role = 'admin';
  const [userName, setUserName] = useState("");
  const [dateRange, setDateRange] = useState("180");
  const [stats, setStats] = useState({
    sucursales: 0,
    alianzas: 0,
    usuarios: 0,
  });

  const isAdminOrUser = role === 'admin' || role === 'user';

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      }
    };

    const fetchStats = async () => {
      const [sucursalesRes, alianzasRes, usuariosRes] = await Promise.all([
        supabase.from("sucursales").select("id", { count: "exact", head: true }),
        supabase.from("alianzas").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        sucursales: sucursalesRes.count || 0,
        alianzas: alianzasRes.count || 0,
        usuarios: usuariosRes.count || 0,
      });
    };

    fetchUserData();
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Sucursales",
      value: stats.sucursales,
      icon: MapPin,
      description: "Sucursales activas",
      color: "from-primary to-primary-hover",
    },
    {
      title: "Alianzas",
      value: stats.alianzas,
      icon: Handshake,
      description: "Alianzas estratégicas",
      color: "from-secondary to-secondary-hover",
    },
    {
      title: "Usuarios",
      value: stats.usuarios,
      icon: Users,
      description: "Usuarios registrados",
      color: "from-primary/70 to-secondary/70",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido{userName ? `, ${userName}` : ""}
            </h1>
            <p className="text-muted-foreground">Sistema de gestión Dovita CRM</p>
          </div>
        </div>
        <KpiFilters dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      <KpiCards />

      <KpiCharts months={parseInt(dateRange) / 30} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{card.value}</div>
              <CardDescription className="text-xs mt-1">{card.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Acerca de Dovita CRM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sistema integral de gestión empresarial diseñado para optimizar tus procesos de negocio.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <h4 className="font-medium text-foreground">Gestión centralizada</h4>
                    <p className="text-sm text-muted-foreground">Administra sucursales, alianzas y contenido corporativo desde un solo lugar</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                  <div>
                    <h4 className="font-medium text-foreground">Control de accesos</h4>
                    <p className="text-sm text-muted-foreground">Sistema robusto de roles y permisos para tu equipo</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdminOrUser && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Vista de Cliente
                </CardTitle>
                <CardDescription>
                  Visualiza el portal cliente tal como lo ven tus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.location.href = '/client?asClient=1'}
                  variant="outline"
                  className="w-full border-primary/50 hover:bg-primary/10"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver como Cliente
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <BirthdayWidget />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
