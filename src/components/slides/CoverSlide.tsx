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
      
      <div className="container mx-auto px-6 relative z-10 min-h-screen flex flex-col">
        {/* Centered Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-8 max-w-5xl animate-fade-in">
            <div className="inline-block p-1 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-3xl backdrop-blur-sm mb-8">
              <Logo size="large" className="mx-auto" />
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold text-white leading-tight tracking-tight">
              De terreno a casa<br />
              <span className="bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">sin estrés</span>
            </h1>
          </div>
        </div>
        
        {/* Footer */}
        <div className="py-6 bg-white/5 backdrop-blur-md border-t border-white/10">
          <p className="text-center text-white/90 text-sm tracking-wide">
            Acompañamiento completo en el diseño y construcción de tu hogar ideal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverSlide;
