import { Monitor, Smartphone, Camera, CreditCard } from "lucide-react";
import Logo from "../Logo";

const features = [
  {
    icon: Monitor,
    title: "Realidad Virtual Inmersiva",
    description: "Recorre tu futura casa habitación por habitación antes de que se construya. Toma decisiones informadas sobre espacios, acabados y diseño."
  },
  {
    icon: Smartphone,
    title: "Plataforma de Cliente",
    description: "Accede desde cualquier dispositivo a tu portal personalizado. Revisa planos, cronogramas y el estado de tu proyecto 24/7."
  },
  {
    icon: Camera,
    title: "Seguimiento Visual",
    description: "Recibe fotos del avance de obra actualizadas semanalmente. Observa cómo tu casa toma forma día a día."
  },
  {
    icon: CreditCard,
    title: "Gestión Financiera Digital",
    description: "Sistema transparente que muestra cada peso invertido, pagos pendientes y un desglose detallado de gastos."
  }
];

const TechnologySlide = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <span className="text-primary/70 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Innovación
            </span>
            
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-3">
              Tecnología de Vanguardia
            </h2>
            <p className="text-lg text-foreground/70 mb-8 max-w-2xl">
              Herramientas digitales que transforman la experiencia de construir
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-primary p-6 rounded-lg hover:bg-primary-dark transition-all">
                  <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-white/80 leading-relaxed text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologySlide;
