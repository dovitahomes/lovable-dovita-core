import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail, Phone, MapPin } from "lucide-react";

interface LeadCardProps {
  lead: any;
  onConvert: () => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onConvert, isDragging }: LeadCardProps) {
  const canConvert = ['nuevo', 'contactado', 'calificado'].includes(lead.status);
  
  return (
    <Card 
      className={`cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          {lead.nombre_completo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {lead.telefono && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{lead.telefono}</span>
          </div>
        )}
        
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        
        {lead.sucursales?.nombre && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{lead.sucursales.nombre}</span>
          </div>
        )}
        
        {lead.origen_lead && lead.origen_lead.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {lead.origen_lead.slice(0, 3).map((origen: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {origen}
              </Badge>
            ))}
            {lead.origen_lead.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{lead.origen_lead.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        {lead.presupuesto_referencia && (
          <div className="pt-2 border-t">
            <Badge variant="secondary" className="font-mono">
              {new Intl.NumberFormat('es-MX', { 
                style: 'currency', 
                currency: 'MXN',
                maximumFractionDigits: 0
              }).format(lead.presupuesto_referencia)}
            </Badge>
          </div>
        )}
        
        {canConvert && (
          <Button 
            size="sm" 
            className="w-full mt-3" 
            onClick={(e) => {
              e.stopPropagation();
              onConvert();
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Convertir
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
