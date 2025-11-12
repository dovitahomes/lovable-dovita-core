import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, ChevronDown, Check, X } from "lucide-react";
import { TUNode } from "../ExecutiveBudgetWizard";
import { cn } from "@/lib/utils";

interface StepSubpartidaSelectionProps {
  selectedSubpartidas: TUNode[];
  onSelectedSubpartidasChange: (subpartidas: TUNode[]) => void;
}

export function StepSubpartidaSelection({
  selectedSubpartidas,
  onSelectedSubpartidasChange,
}: StepSubpartidaSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMayores, setExpandedMayores] = useState<Set<string>>(new Set());
  const [expandedPartidas, setExpandedPartidas] = useState<Set<string>>(new Set());

  const { data: tuNodes, isLoading } = useQuery({
    queryKey: ['tu_nodes_global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('*')
        .eq('project_scope', 'global')
        .order('code');
      if (error) throw error;
      return data as TUNode[];
    }
  });

  const mayores = tuNodes?.filter(n => n.type === 'mayor') || [];
  const partidas = tuNodes?.filter(n => n.type === 'partida') || [];
  const subpartidas = tuNodes?.filter(n => n.type === 'subpartida') || [];

  const filteredData = () => {
    if (!searchTerm.trim()) return { mayores, partidas, subpartidas };

    const search = searchTerm.toLowerCase();
    const filteredSubpartidas = subpartidas.filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.code.toLowerCase().includes(search)
    );

    const partidaIds = new Set(filteredSubpartidas.map(s => s.parent_id).filter(Boolean));
    const filteredPartidas = partidas.filter(p => partidaIds.has(p.id));

    const mayorIds = new Set(filteredPartidas.map(p => p.parent_id).filter(Boolean));
    const filteredMayores = mayores.filter(m => mayorIds.has(m.id));

    return {
      mayores: filteredMayores,
      partidas: filteredPartidas,
      subpartidas: filteredSubpartidas
    };
  };

  const { mayores: displayMayores, partidas: displayPartidas, subpartidas: displaySubpartidas } = filteredData();

  const toggleMayor = (mayorId: string) => {
    const newExpanded = new Set(expandedMayores);
    if (newExpanded.has(mayorId)) {
      newExpanded.delete(mayorId);
    } else {
      newExpanded.add(mayorId);
    }
    setExpandedMayores(newExpanded);
  };

  const togglePartida = (partidaId: string) => {
    const newExpanded = new Set(expandedPartidas);
    if (newExpanded.has(partidaId)) {
      newExpanded.delete(partidaId);
    } else {
      newExpanded.add(partidaId);
    }
    setExpandedPartidas(newExpanded);
  };

  const toggleSubpartida = (subpartida: TUNode) => {
    const isSelected = selectedSubpartidas.some(s => s.id === subpartida.id);
    if (isSelected) {
      onSelectedSubpartidasChange(selectedSubpartidas.filter(s => s.id !== subpartida.id));
    } else {
      onSelectedSubpartidasChange([...selectedSubpartidas, subpartida]);
    }
  };

  const removeSubpartida = (subpartidaId: string) => {
    onSelectedSubpartidasChange(selectedSubpartidas.filter(s => s.id !== subpartidaId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Selección de Subpartidas</h3>
        <p className="text-muted-foreground">
          Navega por el árbol TU y selecciona las subpartidas para el presupuesto
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar subpartida por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Selected Subpartidas */}
      {selectedSubpartidas.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Subpartidas Seleccionadas ({selectedSubpartidas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSubpartidas.map((subpartida) => (
                <Badge
                  key={subpartida.id}
                  variant="default"
                  className="gap-2 py-2 px-3 bg-primary hover:bg-primary/90"
                >
                  <span className="font-mono text-xs">{subpartida.code}</span>
                  <span>{subpartida.name}</span>
                  <button
                    onClick={() => removeSubpartida(subpartida.id)}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TU Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Árbol de Transacciones Unificadas</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[400px] overflow-y-auto space-y-2">
          {displayMayores.map((mayor) => {
            const mayorPartidas = displayPartidas.filter(p => p.parent_id === mayor.id);
            const isExpanded = expandedMayores.has(mayor.id);

            return (
              <div key={mayor.id} className="space-y-1">
                {/* Mayor */}
                <button
                  onClick={() => toggleMayor(mayor.id)}
                  className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shrink-0">
                    {mayor.code}
                  </Badge>
                  <span className="font-semibold text-sm text-left">{mayor.name}</span>
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {mayorPartidas.length} partidas
                  </Badge>
                </button>

                {/* Partidas */}
                {isExpanded && (
                  <div className="ml-8 space-y-1">
                    {mayorPartidas.map((partida) => {
                      const partidaSubpartidas = displaySubpartidas.filter(s => s.parent_id === partida.id);
                      const isPartidaExpanded = expandedPartidas.has(partida.id);

                      return (
                        <div key={partida.id} className="space-y-1">
                          {/* Partida */}
                          <button
                            onClick={() => togglePartida(partida.id)}
                            className="w-full flex items-center gap-2 p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            {isPartidaExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <Badge variant="outline" className="shrink-0">
                              {partida.code}
                            </Badge>
                            <span className="text-sm text-left">{partida.name}</span>
                            <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                              {partidaSubpartidas.length} sub
                            </Badge>
                          </button>

                          {/* Subpartidas */}
                          {isPartidaExpanded && (
                            <div className="ml-8 space-y-1">
                              {partidaSubpartidas.map((subpartida) => {
                                const isSelected = selectedSubpartidas.some(s => s.id === subpartida.id);

                                return (
                                  <button
                                    key={subpartida.id}
                                    onClick={() => toggleSubpartida(subpartida)}
                                    className={cn(
                                      "w-full flex items-center gap-2 p-2 rounded-lg border transition-all",
                                      isSelected
                                        ? "bg-primary/10 border-primary hover:bg-primary/20"
                                        : "hover:bg-muted/50"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : "border-muted-foreground"
                                    )}>
                                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                      {subpartida.code}
                                    </Badge>
                                    <span className="text-sm text-left flex-1">{subpartida.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
