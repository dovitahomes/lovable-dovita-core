import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { RenderOfTheMonth } from "@/components/dashboard/RenderOfTheMonth";
import { CorporatePromotions } from "@/components/dashboard/CorporatePromotions";
import { EmployeeCalendar } from "@/components/dashboard/EmployeeCalendar";

const Dashboard = () => {
  const [userName, setUserName] = useState("");

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

    fetchUserData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Dovita Hub
        </h1>
        <p className="text-muted-foreground">
          Bienvenido{userName ? `, ${userName}` : ""} - Tu espacio de información y recursos
        </p>
      </div>

      {/* Render del Mes */}
      <RenderOfTheMonth />

      {/* Grid: Promociones + Cumpleaños + Calendario */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CorporatePromotions />
        <BirthdayWidget />
        <EmployeeCalendar />
      </div>

      {/* Sección inferior - se completará en fases siguientes */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Acerca de Dovita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Sistema integral de gestión empresarial diseñado para optimizar tus procesos de construcción y diseño.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
