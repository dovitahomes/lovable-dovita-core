import Logo from "../Logo";

const AboutSlide = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-6 py-12">
        <Logo className="mb-12" />
        
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            ¿Quiénes somos?
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground">
            <p>
              <span className="font-semibold text-primary">Dovita</span> es una empresa especializada en 
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
        </div>
      </div>
    </div>
  );
};

export default AboutSlide;
