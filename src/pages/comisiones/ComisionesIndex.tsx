import { useNavigate } from "react-router-dom";
import { DashboardCard } from "@/components/commissions/DashboardCard";
import { DollarSign, Handshake, Users, Settings } from "lucide-react";
import { BACKOFFICE_ROUTES } from "@/config/routes";

export default function ComisionesIndex() {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: "Resumen Financiero",
      description: "Vista general de comisiones, pendientes, pagadas y métricas clave",
      icon: DollarSign,
      gradient: "from-blue-500 to-blue-600",
      onClick: () => navigate(BACKOFFICE_ROUTES.COMISIONES_RESUMEN),
    },
    {
      title: "Por Alianzas",
      description: "Comisiones generadas por alianzas comerciales e inmobiliarias",
      icon: Handshake,
      gradient: "from-purple-500 to-purple-600",
      onClick: () => navigate(BACKOFFICE_ROUTES.COMISIONES_ALIANZAS),
    },
    {
      title: "Por Colaboradores",
      description: "Comisiones del equipo interno por proyectos y ventas",
      icon: Users,
      gradient: "from-green-500 to-green-600",
      onClick: () => navigate(BACKOFFICE_ROUTES.COMISIONES_COLABORADORES),
    },
    {
      title: "Configuración y Reglas",
      description: "Gestiona porcentajes, reglas de cálculo y configuración global",
      icon: Settings,
      gradient: "from-orange-500 to-orange-600",
      onClick: () => navigate(BACKOFFICE_ROUTES.COMISIONES_CONFIGURACION),
    },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden px-4 sm:px-6 py-6 animate-fade-in">
      {/* Grid de cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {dashboardCards.map((card, index) => (
          <div
            key={card.title}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <DashboardCard {...card} />
          </div>
        ))}
      </div>
    </div>
  );
}
