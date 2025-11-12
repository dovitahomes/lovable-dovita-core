import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Partida {
  id: string;
  code: string;
  name: string;
  parent_id: string;
}

interface PartidaSearchProps {
  partidas: Partida[];
  mayorId: string;
  onSelect: (partida: Partida) => void;
  className?: string;
}

export function PartidaSearch({ partidas, mayorId, onSelect, className }: PartidaSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filteredPartidas = partidas
    .filter((p) => p.parent_id === mayorId)
    .filter(
      (p) =>
        searchTerm.length > 0 &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const handleSelect = (partida: Partida) => {
    onSelect(partida);
    setSearchTerm("");
    setShowResults(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    setShowResults(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar partida por nombre o código..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => searchTerm.length > 0 && setShowResults(true)}
          className="pl-10 pr-10"
        />
        {searchTerm.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && filteredPartidas.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-popover border rounded-lg shadow-lg z-50">
          {filteredPartidas.map((partida) => (
            <button
              key={partida.id}
              type="button"
              onClick={() => handleSelect(partida)}
              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2"
            >
              <Badge variant="secondary" className="text-xs shrink-0">
                {partida.code}
              </Badge>
              <span className="text-sm truncate">{partida.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {showResults && searchTerm.length > 0 && filteredPartidas.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 px-3 py-4 text-center text-sm text-muted-foreground">
          No se encontraron partidas
        </div>
      )}
    </div>
  );
}
