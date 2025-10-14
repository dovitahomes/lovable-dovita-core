import Logo from "../Logo";
import vrImage from "@/assets/vr-architecture.jpg";
import designImage from "@/assets/design-blueprint.jpg";

const AboutSlide = () => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-12">
            ¿Quiénes somos?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                <span className="font-semibold text-primary text-2xl">Dovita</span> es una empresa especializada en 
                arquitectura y construcción que te acompaña en todo el proceso, desde la compra de tu terreno 
                hasta la entrega de tu casa terminada.
              </p>
              
              <p>
                Nos diferenciamos por nuestra <span className="font-semibold text-foreground">tecnología de punta</span>, 
                que incluye visualización en realidad virtual de tu futuro hogar, plataforma digital para seguimiento 
                de obra, y un sistema de gestión financiera transparente.
              </p>
              
              <p>
                Con Dovita, construir tu casa no es un proceso estresante, sino una experiencia 
                <span className="font-semibold text-foreground"> emocionante y transparente</span>.
              </p>
            </div>
            
            <div className="relative">
              <img 
                src={vrImage} 
                alt="Tecnología de realidad virtual en arquitectura" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
            </div>
          </div>
          
          <div className="mt-16">
            <img 
              src={designImage} 
              alt="Diseño arquitectónico profesional" 
              className="rounded-2xl shadow-2xl w-full h-96 object-cover"
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-primary py-4">
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
