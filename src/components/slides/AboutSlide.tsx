import Logo from "../Logo";
import vrImage from "@/assets/vr-architecture.jpg";
import designImage from "@/assets/design-blueprint.jpg";

const AboutSlide = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 grid md:grid-cols-2">
        {/* Left Column - Content */}
        <div className="bg-white p-8 md:p-12 flex items-center overflow-y-auto">
          <div className="max-w-xl">
            <span className="text-primary/70 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Sobre Nosotros
            </span>
            
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              ¿Quiénes somos?
            </h2>
            
            <div className="space-y-4 text-base text-foreground/80">
              <p className="leading-relaxed">
                <span className="font-bold text-primary text-2xl">Dovita</span> es un despacho de arquitectos y 
                constructora con sede en <span className="font-semibold text-foreground">Querétaro y San Luis Potosí</span>, 
                orientado al servicio al cliente y enfocado en brindarte un 
                <span className="font-semibold text-foreground"> servicio 360°</span>.
              </p>
              
              <p className="leading-relaxed">
                Te acompañamos en cada etapa: desde la <span className="font-semibold text-foreground">asesoría inicial</span> y 
                el <span className="font-semibold text-foreground">diseño integral</span> de tu vivienda, 
                pasando por la <span className="font-semibold text-foreground">construcción</span>, hasta 
                el <span className="font-semibold text-foreground">seguimiento postventa</span>. Todo con la transparencia y 
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
          </div>
        </div>
        
        {/* Right Column - Image */}
        <div className="relative overflow-hidden">
          <img 
            src={vrImage} 
            alt="Tecnología de realidad virtual en arquitectura" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default AboutSlide;
