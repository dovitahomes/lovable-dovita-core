import { useEffect, useState } from "react";
import { FinancialSummary } from "@/components/client/FinancialSummary";

export default function ClientFinanzas() {
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const storedProjectId = localStorage.getItem("client.activeProject");
    if (storedProjectId) {
      setProjectId(storedProjectId);
    }
  }, []);

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Finanzas</h1>
      <FinancialSummary projectId={projectId} />
    </div>
  );
}
