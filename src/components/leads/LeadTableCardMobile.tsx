import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Mail, Eye, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

interface LeadTableCardMobileProps {
  lead: any;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onOpenDetails: (leadId: string) => void;
}

export function LeadTableCardMobile({ 
  lead, 
  selected, 
  onSelect, 
  onOpenDetails 
}: LeadTableCardMobileProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.telefono) {
      window.location.href = `tel:${lead.telefono}`;
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.email) {
      window.location.href = `mailto:${lead.email}`;
    }
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all cursor-pointer",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => onOpenDetails(lead.id)}
    >
      <CardContent className="p-3 space-y-2.5">
        {/* Header: Checkbox + Avatar + Nombre + Sucursal */}
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getInitials(lead.nombre_completo)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{lead.nombre_completo}</p>
            {lead.sucursales?.nombre && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {lead.sucursales.nombre}
              </p>
            )}
          </div>
        </div>

        {/* Contacto: Teléfono y Email */}
        <div className="space-y-1">
          {lead.telefono && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.telefono}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Terreno + Presupuesto */}
        <div className="flex items-center gap-3 text-xs">
          {lead.terreno_m2 && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Terreno:</span>
              <span className="font-mono font-medium">{lead.terreno_m2} m²</span>
            </div>
          )}
          {lead.presupuesto_referencia && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Ppto:</span>
              <span className="font-mono font-medium">
                {new Intl.NumberFormat('es-MX', {
                  style: 'currency',
                  currency: 'MXN',
                  maximumFractionDigits: 0,
                  notation: 'compact'
                }).format(lead.presupuesto_referencia)}
              </span>
            </div>
          )}
        </div>

        {/* Footer: Status + Último Contacto + Quick Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.status} />
            {lead.last_activity && (
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(lead.last_activity), {
                  addSuffix: true,
                  locale: es
                })}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {lead.telefono && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7" 
                onClick={handleCall}
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>
            )}
            {lead.email && (
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-7 w-7" 
                onClick={handleEmail}
              >
                <Mail className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7" 
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(lead.id);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
