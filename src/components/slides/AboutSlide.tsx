import Logo from "../Logo";
import vrImage from "@/assets/vr-architecture.jpg";
import designImage from "@/assets/design-blueprint.jpg";

const AboutSlide = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-muted/50 to-background flex flex-col">
      {/* Header with glassmorphism */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-12 py-20 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-start mb-24">
            <div className="space-y-8">
              <h2 className="text-6xl md:text-7xl font-bold text-primary leading-none">
                ¿Quiénes<br />somos?
              </h2>
              
              <p className="text-xl text-foreground/70 leading-relaxed">
                Somos un despacho de arquitectos y constructora con sede en Querétaro y San Luis Potosí, 
                dedicados a brindarte un servicio 360° que abarca desde la asesoría y diseño integral de tu vivienda 
                hasta la construcción y el seguimiento postventa.
              </p>
              
              <p className="text-xl text-foreground/70 leading-relaxed">
                Nos enfocamos en el servicio al cliente y nos diferenciamos por nuestra tecnología de punta: 
                visualización en realidad virtual de tu futuro hogar, plataforma digital para seguimiento de obra, 
                y un sistema de gestión financiera transparente.
              </p>
            </div>
            
            <div className="relative">
              <img 
                src={vrImage} 
                alt="Tecnología de realidad virtual en arquitectura" 
                className="rounded-2xl shadow-xl w-full h-auto"
              />
            </div>
          </div>
          
          <div className="relative h-[500px] rounded-2xl overflow-hidden">
            <img 
              src={designImage} 
              alt="Diseño arquitectónico profesional" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 border-t border-white/10">
        <div className="container mx-auto px-6">
          <p className="text-center text-white text-sm">
            Transformando sueños en hogares reales
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutSlide;
