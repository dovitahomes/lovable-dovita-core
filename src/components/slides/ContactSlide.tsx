import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "../Logo";
import { Button } from "../ui/button";

const ContactSlide = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary via-primary-dark to-primary-light relative overflow-hidden">
      {/* Header */}
      <div className="bg-primary-dark border-b-4 border-secondary">
        <div className="container mx-auto px-6 py-4">
          <Logo className="brightness-0 invert" />
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-white/90 mb-12">
            Agenda una consulta gratuita y descubre cómo podemos hacer realidad tu hogar
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Phone className="h-10 w-10 text-white mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Teléfono</h3>
              <p className="text-white/80">+52 123 456 7890</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <Mail className="h-10 w-10 text-white mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Email</h3>
              <p className="text-white/80">contacto@dovita.com</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <MapPin className="h-10 w-10 text-white mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">Ubicación</h3>
              <p className="text-white/80">Ciudad de México</p>
            </div>
          </div>
          
          <Button 
            size="lg" 
            className="bg-secondary hover:bg-secondary/90 text-foreground font-bold text-lg px-12 py-6 h-auto shadow-2xl"
          >
            Agendar Consulta Gratuita
          </Button>
          
          <div className="mt-16 bg-primary-dark/50 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
            <Logo size="large" className="mx-auto brightness-0 invert" />
            <p className="text-white/90 mt-4 text-lg font-medium">
              De terreno a casa sin estrés
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-primary-dark border-t-4 border-secondary py-6">
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
