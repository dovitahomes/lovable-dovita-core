import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Cake, Sparkles } from "lucide-react";
import { formatDateOnly } from "@/lib/datetime";
import { cn } from "@/lib/utils";

// Helper: Generar iniciales de 2 letras
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper: Verificar si es el día exacto de hoy
const isToday = (dateString: string): boolean => {
  const today = new Date();
  // Usar string parsing en lugar de Date constructor
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    today.getDate() === day && 
    today.getMonth() + 1 === month
  );
};

// Helper: Obtener solo el día del mes
const getDayOfMonth = (dateString: string): number => {
  // Extraer día directamente del string 'YYYY-MM-DD'
  return parseInt(dateString.substring(8, 10), 10);
};

// Helper: Verificar si está próximo (dentro de 3 días)
const isUpcoming = (dateString: string): boolean => {
  const today = new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Crear fecha de cumpleaños para el año actual
  const birthday = new Date(today.getFullYear(), month - 1, day);
  
  const diffTime = birthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 && diffDays <= 3;
};

export const BirthdayWidget = () => {
  const { data: birthdays, isLoading } = useQuery({
    queryKey: ["birthdays-this-month"],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      
      // PASO 1: Obtener user_ids que NO son clientes
      const { data: userRolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .neq("role_name", "cliente");
      
      if (rolesError) throw rolesError;
      if (!userRolesData || userRolesData.length === 0) return [];
      
      const nonClientUserIds = userRolesData.map(ur => ur.user_id);
      
      // PASO 2: Obtener profiles de esos usuarios con cumpleaños
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, fecha_nacimiento, avatar_url")
        .not("fecha_nacimiento", "is", null)
        .in("id", nonClientUserIds)
        .order("fecha_nacimiento");

      if (error) throw error;
      if (!data) return [];

      // Filtrar por mes actual usando string parsing para evitar problemas de timezone
      return data.filter((user) => {
        if (!user.fecha_nacimiento) return false;
        // Extraer mes directamente del string 'YYYY-MM-DD' (posición 5-6)
        const birthMonth = parseInt(user.fecha_nacimiento.substring(5, 7), 10);
        return birthMonth === currentMonth;
      });
    },
  });

  if (isLoading) {
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                <div className="h-16 w-16 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-14 w-14 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!birthdays || birthdays.length === 0) {
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
          <div className="text-center py-8">
            <Cake className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay cumpleaños este mes
            </p>
          </div>
        </CardContent>
      </Card>
    );
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
          {birthdays.map((person, index) => {
            const isBirthdayToday = isToday(person.fecha_nacimiento);
            const isBirthdayUpcoming = !isBirthdayToday && isUpcoming(person.fecha_nacimiento);

            return (
              <div
                key={`${person.email}-${index}`}
                className={cn(
                  "group relative overflow-hidden rounded-xl p-4 transition-all duration-300 animate-fade-in",
                  "bg-gradient-to-br from-background via-background to-muted/20",
                  "border hover:shadow-xl hover:scale-[1.02]",
                  isBirthdayToday 
                    ? "border-yellow-500 ring-2 ring-yellow-500/20" 
                    : "border-primary/20"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Confetti background si es HOY */}
                {isBirthdayToday && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full" />
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-orange-400 rounded-full" />
                    <div className="absolute top-0 left-3/4 w-2 h-2 bg-red-400 rounded-full" />
                  </div>
                )}

                <div className="relative flex items-center gap-4">
                  {/* Avatar circular */}
                  <Avatar className={cn(
                    "h-16 w-16 shadow-md transition-all",
                    isBirthdayToday 
                      ? "ring-4 ring-yellow-500/40" 
                      : "ring-2 ring-primary/30"
                  )}>
                    {person.avatar_url ? (
                      <AvatarImage src={person.avatar_url} alt={person.full_name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-lg font-bold">
                        {getInitials(person.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  
                  {/* Info del empleado */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{person.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        {person.fecha_nacimiento && formatDateOnly(person.fecha_nacimiento, "dd 'de' MMMM")}
                      </p>
                    </div>
                    
                    {/* Badge especial si es HOY */}
                    {isBirthdayToday && (
                      <Badge 
                        variant="default" 
                        className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-0 shadow-lg"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        ¡Hoy es su cumpleaños!
                      </Badge>
                    )}

                    {/* Badge si está próximo */}
                    {isBirthdayUpcoming && (
                      <Badge 
                        variant="secondary" 
                        className="mt-2"
                      >
                        Próximamente
                      </Badge>
                    )}
                  </div>
                  
                  {/* Badge circular con el día */}
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all",
                      isBirthdayToday 
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                        : "bg-gradient-to-br from-primary to-primary/80"
                    )}>
                      <span className="text-xl font-bold text-white">
                        {getDayOfMonth(person.fecha_nacimiento)}
                      </span>
                    </div>
                    <Cake className={cn(
                      "h-4 w-4 transition-colors",
                      isBirthdayToday ? "text-yellow-500" : "text-primary"
                    )} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
