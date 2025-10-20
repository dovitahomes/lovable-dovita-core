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
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 grid md:grid-cols-2">
        {/* Left Column - Image */}
        <div className="relative overflow-hidden">
          <img 
            src={servicesImage} 
            alt="Interior de casa Dovita" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        {/* Right Column - Content */}
        <div className="bg-primary p-8 md:p-12 flex items-center overflow-y-auto">
          <div className="max-w-xl">
            <span className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Servicios
            </span>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Nuestros Servicios
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Todo lo que necesitas para construir tu casa ideal
            </p>
            
            <div className="grid grid-cols-1 gap-6">
              {services.map((service, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-lg hover:bg-white/20 transition-all">
                  <div className="w-14 h-14 bg-secondary rounded-lg flex items-center justify-center mb-4">
                    <service.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{service.title}</h3>
                  <p className="text-white/80 text-sm">{service.description}</p>
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
