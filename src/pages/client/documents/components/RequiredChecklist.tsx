import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/client/Section";
import { Skeleton } from "@/components/ui/skeleton";

interface RequiredDoc {
  name: string;
  category: string;
  stage?: "arq" | "ejec";
}

interface Document {
  id: string;
  nombre: string;
  etiqueta?: string | null;
}

interface RequiredChecklistProps {
  required: RequiredDoc[];
  documents: Document[];
  isLoading: boolean;
}

export function RequiredChecklist({
  required,
  documents,
  isLoading,
}: RequiredChecklistProps) {
  const checkCompletion = (req: RequiredDoc): boolean => {
    return documents.some(
      (doc) =>
        doc.etiqueta === req.category ||
        doc.nombre.toLowerCase().includes(req.name.toLowerCase())
    );
  };

  const completed = required.filter(checkCompletion).length;
  const total = required.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (isLoading) {
    return <Skeleton className="h-48 rounded-2xl" />;
  }

  if (required.length === 0) {
    return null;
  }

  return (
    <Section title="Documentos Requeridos">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {completed} de {total} completados
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Completa la documentación requerida
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-amber-400/90 text-amber-900 font-semibold"
          >
            {progress}%
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--dovita-blue))] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {required.map((req, idx) => {
            const isComplete = checkCompletion(req);
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${
                      isComplete
                        ? "text-slate-600 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {req.name}
                  </p>
                  {req.stage && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Etapa: {req.stage === "arq" ? "Arquitectura" : "Ejecución"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
