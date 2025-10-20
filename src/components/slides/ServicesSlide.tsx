import { Building2, Eye, Wallet, MessageCircle } from "lucide-react";
import Logo from "../Logo";
import servicesImage from "@/assets/services-interior.jpg";

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
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-6 py-3">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 grid md:grid-cols-2 overflow-hidden">
        {/* Left Column - Image */}
        <div className="relative overflow-hidden">
          <img 
            src={servicesImage} 
            alt="Interior de casa Dovita" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        {/* Right Column - Content */}
        <div className="bg-primary p-6 md:p-8 flex items-center overflow-hidden">
          <div className="w-full">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 block">
              Servicios
            </span>
            
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Nuestros Servicios
            </h2>
            <p className="text-base text-white/80 mb-6">
              Todo lo que necesitas para construir tu casa ideal
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              {services.map((service, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg hover:bg-white/20 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1 text-white">{service.title}</h3>
                      <p className="text-white/80 text-sm leading-snug">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesSlide;
