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
      
      <div className="container mx-auto px-6 py-16 relative z-10 flex-1 flex items-center">
        <div className="max-w-3xl mx-auto text-center w-full">
          <div className="inline-block p-1 bg-white/10 backdrop-blur-sm rounded-3xl mb-12">
            <Logo size="large" className="mx-auto" />
          </div>
          
          <div className="inline-block mb-6">
            <span className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full text-sm border border-white/20">
              Estamos listos para ayudarte
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Contacto
          </h2>
          
          <div className="mb-12 p-8 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
            <div className="flex items-center justify-center gap-4">
              <Phone className="h-8 w-8 text-secondary" />
              <p className="text-3xl text-white font-light tracking-wider">477 4752522</p>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-primary font-bold text-lg px-12 py-6 h-auto shadow-2xl transition-all hover:scale-105"
          >
            Agendar Consulta Gratuita
          </Button>
          
          <p className="text-white/90 mt-12 text-xl font-light">
            De terreno a casa sin estrés
          </p>
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
