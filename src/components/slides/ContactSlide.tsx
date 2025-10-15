import { Phone } from "lucide-react";
import Logo from "../Logo";
import { Button } from "@/components/ui/button";

const ContactSlide = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 grid md:grid-cols-2">
        {/* Left Column - Contact Info */}
        <div className="bg-primary p-16 flex items-center justify-center">
          <div className="max-w-xl text-center">
            <Logo size="large" className="mx-auto mb-12 brightness-0 invert" />
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8">
              ¿Listo para construir tu hogar?
            </h2>
            
            <div className="flex items-center justify-center gap-4 mb-8">
              <Phone className="h-8 w-8 text-secondary" />
              <a 
                href="tel:+524424961500" 
                className="text-3xl font-bold text-white hover:text-secondary transition-colors"
              >
                442 496 1500
              </a>
            </div>
            
            <Button 
              size="lg"
              className="bg-secondary text-primary hover:bg-secondary/90 font-bold px-8 py-6 text-lg"
            >
              Contáctanos
            </Button>
          </div>
        </div>
        
        {/* Right Column - Message */}
        <div className="bg-white p-16 flex items-center justify-center">
          <div className="max-w-xl">
            <h3 className="text-4xl font-bold text-primary mb-6">
              Tu casa, nuestra experiencia
            </h3>
            <p className="text-xl text-foreground/70 mb-8 leading-relaxed">
              En Dovita transformamos terrenos en hogares sin estrés. 
              Déjanos acompañarte en cada paso del camino hacia la casa de tus sueños.
            </p>
            <p className="text-lg text-foreground/60">
              Querétaro • San Luis Potosí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSlide;
