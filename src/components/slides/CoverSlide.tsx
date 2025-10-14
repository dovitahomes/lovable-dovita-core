import Logo from "../Logo";
import heroImage from "@/assets/hero-house.jpg";

const CoverSlide = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Hero Image Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Casa moderna de lujo" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary-dark/85 to-primary/80" />
      </div>
      
      {/* Header with Logo */}
      <div className="absolute top-0 left-0 right-0 bg-primary/95 backdrop-blur-sm border-b-4 border-secondary">
        <div className="container mx-auto px-6 py-4">
          <Logo className="brightness-0 invert" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10 min-h-screen flex items-center">
        <div className="text-center space-y-8 max-w-4xl mx-auto pt-20">
          <Logo size="large" className="mx-auto brightness-0 invert mb-8" />
          
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            De terreno a casa<br />
            <span className="text-secondary">sin estrés</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Acompañamiento completo en el diseño y construcción de tu hogar ideal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverSlide;
