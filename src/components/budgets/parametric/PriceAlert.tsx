import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceAlertProps {
  partidaId: string;
  currentPrice: number;
  className?: string;
}

export function PriceAlert({ partidaId, currentPrice, className }: PriceAlertProps) {
  const { data: historicalPrices } = useQuery({
    queryKey: ['historical_prices', partidaId],
    queryFn: async () => {
      // Get last 10 uses of this partida in budget_items
      const { data, error } = await supabase
        .from('budget_items')
        .select('costo_unit, created_at')
        .eq('partida_id', partidaId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!partidaId && currentPrice > 0,
  });

  if (!historicalPrices || historicalPrices.length === 0 || currentPrice === 0) {
    return null;
  }

  // Calculate average historical price
  const avgPrice = historicalPrices.reduce((sum, item) => sum + Number(item.costo_unit), 0) / historicalPrices.length;
  const variation = ((currentPrice - avgPrice) / avgPrice) * 100;
  const isSignificant = Math.abs(variation) > 5;

  if (!isSignificant) {
    return null;
  }

  const isIncrease = variation > 0;

  return (
    <Alert
      variant={isIncrease ? "destructive" : "default"}
      className={cn("animate-fade-in", className)}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center gap-2 flex-wrap">
        <span className="text-sm">
          {isIncrease ? "Precio superior" : "Precio inferior"} al promedio histórico
        </span>
        <Badge
          variant={isIncrease ? "destructive" : "default"}
          className={cn(
            "gap-1",
            !isIncrease && "bg-green-500"
          )}
        >
          {isIncrease ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isIncrease ? '+' : ''}{variation.toFixed(2)}%
        </Badge>
        <span className="text-xs text-muted-foreground">
          (Promedio: {new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
          }).format(avgPrice)})
        </span>
      </AlertDescription>
    </Alert>
  );
}
