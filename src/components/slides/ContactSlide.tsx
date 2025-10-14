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
        <div className="absolute inset-0 bg-primary/85" />
      </div>
      
      {/* Header */}
      <div className="bg-white shadow-md relative z-10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 relative z-10 flex-1 flex items-center">
        <div className="max-w-3xl mx-auto text-center w-full">
          <Logo size="large" className="mx-auto mb-12" />
          
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 uppercase tracking-wide">
            Contacto
          </h2>
          
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Phone className="h-8 w-8 text-secondary" />
              <p className="text-3xl text-white font-light tracking-wider">477 4752522</p>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-secondary hover:bg-secondary/90 text-primary font-bold text-lg px-12 py-6 h-auto shadow-2xl"
          >
            Agendar Consulta Gratuita
          </Button>
          
          <p className="text-white/90 mt-12 text-xl font-light">
            De terreno a casa sin estrés
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-primary-dark py-6 mt-auto relative z-10">
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
