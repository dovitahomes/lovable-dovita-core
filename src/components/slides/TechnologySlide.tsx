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
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10 relative z-10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 flex-1 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-semibold rounded-full text-sm border border-primary/20">
              Innovación
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-4">
            Tecnología de Vanguardia
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Herramientas digitales que transforman la experiencia de construir
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-0 group-hover:opacity-40 transition duration-500"></div>
                <Card className="relative p-8 hover:shadow-2xl transition-all border-2 border-border hover:border-primary/50 bg-white/70 backdrop-blur-sm h-full">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-xl`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 border-t border-white/10 relative z-10">
        <div className="container mx-auto px-6">
          <p className="text-center text-white text-sm">
            Innovación tecnológica al servicio de tu hogar
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnologySlide;
