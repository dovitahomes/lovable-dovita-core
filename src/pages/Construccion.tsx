import { useParams } from "react-router-dom";
import ConstruccionDashboard from "@/pages/construccion/ConstruccionDashboard";

export default function Construccion() {
  const { id } = useParams();

  if (!id) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Selecciona un proyecto para ver su construcción</p>
      </div>
    );
  }

  return <ConstruccionDashboard projectId={id} />;
}
