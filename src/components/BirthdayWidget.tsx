import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Cake } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const BirthdayWidget = () => {
  const { data: birthdays } = useQuery({
    queryKey: ["birthdays-this-month"],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, fecha_nacimiento")
        .not("fecha_nacimiento", "is", null)
        .order("fecha_nacimiento");

      if (error) throw error;
      if (!data) return [];

      // Filter by current month on client side
      return data.filter((user) => {
        if (!user.fecha_nacimiento) return false;
        const birthMonth = new Date(user.fecha_nacimiento).getMonth() + 1;
        return birthMonth === currentMonth;
      });
    },
  });

  if (!birthdays || birthdays.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" />
          Cumpleaños del Mes
        </CardTitle>
        <CardDescription>Celebra a tu equipo</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {birthdays.map((person, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-sm">{person.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {person.fecha_nacimiento && format(new Date(person.fecha_nacimiento), "dd 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
