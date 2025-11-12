import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Receipt, Mail, Phone, Eye, Edit, FileBarChart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  code_short: string;
  name: string;
  fiscales_json?: {
    rfc?: string;
  };
  contacto_json?: {
    email?: string;
    telefono?: string;
  };
  activo: boolean;
}

interface ProviderCardProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onView: (provider: Provider) => void;
  onViewUsage: (provider: Provider) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export function ProviderCard({
  provider,
  onEdit,
  onView,
  onViewUsage,
  onDelete,
  index = 0,
}: ProviderCardProps) {
  // Get initials from code_short (first 2 letters)
  const initials = provider.code_short.slice(0, 2).toUpperCase();

  return (
    <Card
      className={cn(
        "group hover:scale-[1.02] transition-all duration-200 hover:shadow-xl",
        "bg-gradient-to-br from-blue-50/50 to-indigo-50/50",
        "dark:from-blue-950/20 dark:to-indigo-950/20",
        "border-border hover:border-primary/20",
        "animate-fade-in"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar with Initials */}
          <Avatar className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500">
            <AvatarFallback className="text-white font-bold bg-transparent">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name and Badge */}
          <div className="flex-1 min-w-0">
            <Badge className="mb-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
              {provider.code_short}
            </Badge>
            <h3 className="font-semibold text-lg truncate">{provider.name}</h3>
          </div>

          {/* Status Badge */}
          <Badge variant={provider.activo ? "default" : "secondary"} className="shrink-0">
            {provider.activo ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Info Chips */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Receipt className="h-4 w-4 shrink-0" />
          <span className="truncate">{provider.fiscales_json?.rfc || "Sin RFC"}</span>
        </div>

        {provider.contacto_json?.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate">{provider.contacto_json.email}</span>
          </div>
        )}

        {provider.contacto_json?.telefono && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{provider.contacto_json.telefono}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-1 pt-2 border-t opacity-0 md:group-hover:opacity-100 md:opacity-0 opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(provider)}
            title="Ver detalles"
            className="h-8 w-8 md:h-6 md:w-6 p-0"
          >
            <Eye className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(provider)}
            title="Editar"
            className="h-8 w-8 md:h-6 md:w-6 p-0"
          >
            <Edit className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewUsage(provider)}
            title="Ver uso en proyectos"
            className="h-8 w-8 md:h-6 md:w-6 p-0"
          >
            <FileBarChart className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(provider.id)}
            title="Desactivar"
            className="h-8 w-8 md:h-6 md:w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
