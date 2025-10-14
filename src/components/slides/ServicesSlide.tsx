import { Building2, Eye, Wallet, MessageCircle } from "lucide-react";
import Logo from "../Logo";
import { Card } from "../ui/card";

const services = [
  {
    icon: Building2,
    title: "Diseño y Construcción",
    description: "Gestionamos todo el proceso, desde el diseño arquitectónico hasta la construcción completa de tu hogar."
  },
  {
    icon: Eye,
    title: "Realidad Virtual",
    description: "Visualiza tu casa antes de construirla con nuestra tecnología de realidad virtual de última generación."
  },
  {
    icon: Wallet,
    title: "Gestión Financiera",
    description: "Plataforma transparente donde puedes ver el uso de tus fondos, pagos realizados y saldos pendientes."
  },
  {
    icon: MessageCircle,
    title: "Comunicación Directa",
    description: "Chat integrado con el equipo de obra para resolver dudas y recibir actualizaciones en tiempo real."
  }
];

const ServicesSlide = () => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-semibold rounded-full text-sm border border-primary/20">
              Servicios
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Todo lo que necesitas para construir tu casa ideal
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                <Card className="relative p-8 hover:shadow-2xl transition-all border-2 border-border hover:border-primary/50 bg-white/50 backdrop-blur-sm">
                  <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <service.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 border-t border-white/10">
        <div className="container mx-auto px-6">
          <p className="text-center text-white text-sm">
            Servicios integrales para tu proyecto de construcción
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServicesSlide;
