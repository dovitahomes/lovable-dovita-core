import { Monitor, Smartphone, Camera, CreditCard } from "lucide-react";
import Logo from "../Logo";
import { Card } from "../ui/card";

const features = [
  {
    icon: Monitor,
    title: "Realidad Virtual Inmersiva",
    description: "Recorre tu futura casa habitación por habitación antes de que se construya. Toma decisiones informadas sobre espacios, acabados y diseño.",
    color: "bg-blue-500"
  },
  {
    icon: Smartphone,
    title: "Plataforma de Cliente",
    description: "Accede desde cualquier dispositivo a tu portal personalizado. Revisa planos, cronogramas y el estado de tu proyecto 24/7.",
    color: "bg-purple-500"
  },
  {
    icon: Camera,
    title: "Seguimiento Visual",
    description: "Recibe fotos del avance de obra actualizadas semanalmente. Observa cómo tu casa toma forma día a día.",
    color: "bg-green-500"
  },
  {
    icon: CreditCard,
    title: "Gestión Financiera Digital",
    description: "Sistema transparente que muestra cada peso invertido, pagos pendientes y un desglose detallado de gastos.",
    color: "bg-yellow-500"
  }
];

const TechnologySlide = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-muted/50 to-background">
      {/* Header */}
      <div className="bg-primary border-b-4 border-secondary">
        <div className="container mx-auto px-6 py-4">
          <Logo className="brightness-0 invert" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Tecnología de Vanguardia
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Herramientas digitales que transforman la experiencia de construir
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 hover:shadow-2xl transition-all border-2 hover:border-primary/50">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologySlide;
