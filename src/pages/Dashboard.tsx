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
          // Extraer solo el primer nombre
          const firstName = profile.full_name.split(' ')[0];
          setUserName(firstName);
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 mb-8">
        {/* Dovita Hub - Discreto pero legible */}
        <p className="text-base font-medium text-muted-foreground">
          Dovita Hub
        </p>
        
        {/* Bienvenida con Gradient Azul → Naranja en el nombre */}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">
          <span className="text-foreground">Bienvenido </span>
          <span className="bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
            {userName || "Usuario"}
          </span>
        </h1>
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
