import Logo from "../Logo";
import heroImage from "@/assets/hero-house.jpg";

const CoverSlide = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-light">
      {/* Hero Image Background with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Casa moderna de lujo" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary-dark/70 to-primary-light/60" />
      </div>
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="container mx-auto px-12 relative z-10 min-h-screen flex flex-col justify-center">
        <div className="max-w-4xl space-y-12 animate-fade-in">
          <div className="inline-block mb-8">
            <Logo size="large" />
          </div>
          
          <h1 className="text-7xl md:text-9xl font-bold text-white leading-none tracking-tight">
            De terreno a casa<br />
            sin estrés
          </h1>
          
          <p className="text-2xl md:text-3xl text-white/90 font-light max-w-2xl">
            Acompañamiento completo en el diseño y construcción de tu hogar ideal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverSlide;
