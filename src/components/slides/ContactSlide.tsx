import { Phone, Mail, MapPin } from "lucide-react";
import Logo from "../Logo";
import { Button } from "@/components/ui/button";
import houseRender from "@/assets/house-render-contact.jpg";

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
        
        {/* Right Column - Message with Background */}
        <div className="relative overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={houseRender} 
              alt="Render de casa moderna" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-white/80" />
          </div>
          
          {/* Content */}
          <div className="relative p-16 flex items-center justify-center h-full">
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
      
      {/* Dark Footer */}
      <div className="bg-[#1a1a1a] text-white py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Logo className="brightness-0 invert h-8" />
            </div>
            
            {/* Contact Info */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-white/60" />
                <span className="text-white/80">+52 1000 000 0000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/60" />
                <span className="text-white/80">contacto@dovita.mx</span>
              </div>
              <div className="flex items-start gap-2 mt-2">
                <MapPin className="h-4 w-4 text-white/60 mt-1 flex-shrink-0" />
                <span className="text-white/80">Av. Armando Britain Shaffler 2001, Centro Sur, Querétaro</span>
              </div>
            </div>
            
            {/* Social Media and Copyright */}
            <div className="flex flex-col gap-2 text-sm text-right">
              <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Instagram</span>
              <span className="text-white/60 hover:text-white cursor-pointer transition-colors">Facebook</span>
              <span className="text-sm text-white/70 mt-2">© 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSlide;
