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
    <div className="min-h-screen w-full bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12 flex-1">
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Todo lo que necesitas para construir tu casa ideal
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="p-8 hover:shadow-xl transition-shadow border-2">
                <service.icon className="h-12 w-12 text-secondary mb-4" />
                <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-primary py-4">
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
