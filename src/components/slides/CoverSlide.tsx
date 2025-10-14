import Logo from "../Logo";
import heroImage from "@/assets/hero-house.jpg";

const CoverSlide = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white">
      {/* Hero Image Background */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Casa moderna de lujo" 
          className="w-full h-full object-cover opacity-30"
        />
      </div>
      
      <div className="container mx-auto px-6 relative z-10 min-h-screen flex flex-col">
        {/* Centered Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-8 max-w-4xl">
            <Logo size="large" className="mx-auto mb-12" />
            
            <h1 className="text-5xl md:text-7xl font-bold text-primary leading-tight uppercase tracking-wide">
              De terreno a casa<br />
              sin estrés
            </h1>
          </div>
        </div>
        
        {/* Footer */}
        <div className="py-6 bg-primary">
          <p className="text-center text-white text-sm">
            Acompañamiento completo en el diseño y construcción de tu hogar ideal
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverSlide;
