import { Phone } from "lucide-react";
import Logo from "../Logo";
import { Button } from "../ui/button";
import contactRender from "@/assets/contact-render.jpg";

const ContactSlide = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={contactRender} 
          alt="Casa moderna render" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-dark/85 to-primary-light/90" />
      </div>
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10 relative z-10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-12 py-20 relative z-10 flex-1 flex items-center">
        <div className="max-w-6xl w-full">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <Logo size="large" />
              
              <h2 className="text-6xl md:text-7xl font-bold text-white leading-none">
                Contacto
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Phone className="h-8 w-8 text-secondary" />
                  <p className="text-3xl text-white font-light">477 4752522</p>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-white font-bold text-xl px-12 py-7 h-auto rounded-full shadow-2xl transition-all"
              >
                Agendar Consulta Gratuita
              </Button>
            </div>
            
            <div className="text-white/70 text-lg leading-relaxed space-y-4">
              <p>
                De terreno a casa sin estrés. Acompañamiento completo en el diseño y construcción de tu hogar ideal.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-primary-dark/50 backdrop-blur-md py-6 mt-auto relative z-10 border-t border-white/10">
        <div className="container mx-auto px-6">
          <p className="text-center text-white/70 text-sm">
            © 2025 Dovita. Todos los derechos reservados. | Arquitectura y Construcción de Vanguardia
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactSlide;
