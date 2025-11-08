import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BirthdayWidget } from "@/components/BirthdayWidget";
import { RenderOfTheMonth } from "@/components/dashboard/RenderOfTheMonth";
import { CorporatePromotions } from "@/components/dashboard/CorporatePromotions";
import { EmployeeCalendar } from "@/components/dashboard/EmployeeCalendar";
import { CompanyManuals } from "@/components/dashboard/CompanyManuals";
import { MyProjectsWidget } from "@/components/dashboard/MyProjectsWidget";

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

      {/* Manuales de Operación */}
      <CompanyManuals />

      {/* Mis Proyectos */}
      <MyProjectsWidget />
    </div>
  );
};

export default Dashboard;
