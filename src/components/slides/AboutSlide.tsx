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
      
      <div className="container mx-auto px-6 py-16 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-semibold rounded-full text-sm border border-primary/20">
              Sobre Nosotros
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-12">
            ¿Quiénes somos?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6 text-lg text-foreground/80">
              <p className="leading-relaxed">
                <span className="font-bold text-primary text-2xl">Dovita</span> es un despacho de arquitectos y 
                constructora con sede en <span className="font-semibold text-foreground">Querétaro y San Luis Potosí</span>, 
                orientado al servicio al cliente y enfocado en brindarte un 
                <span className="font-semibold text-foreground"> servicio 360°</span>.
              </p>
              
              <p className="leading-relaxed">
                Te acompañamos en cada etapa: desde la asesoría inicial y el diseño integral de tu vivienda, 
                pasando por la construcción, hasta el seguimiento postventa. Todo con la transparencia y 
                profesionalismo que tu proyecto merece.
              </p>
              
              <p className="leading-relaxed">
                Nos diferenciamos por nuestra <span className="font-semibold text-foreground">tecnología de punta</span>, 
                que incluye visualización en realidad virtual de tu futuro hogar, plataforma digital para seguimiento 
                de obra, y un sistema de gestión financiera transparente.
              </p>
              
              <p className="leading-relaxed">
                Con Dovita, construir tu casa no es un proceso estresante, sino una experiencia 
                <span className="font-semibold text-foreground"> emocionante y transparente</span>.
              </p>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <img 
                src={vrImage} 
                alt="Tecnología de realidad virtual en arquitectura" 
                className="relative rounded-3xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary-light rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <img 
              src={designImage} 
              alt="Diseño arquitectónico profesional" 
              className="relative rounded-3xl shadow-2xl w-full h-96 object-cover"
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
