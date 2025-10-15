import Logo from "../Logo";
import heroImage from "@/assets/hero-house.jpg";

const CoverSlide = () => {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 grid md:grid-cols-2">
        {/* Left Column - Image */}
        <div className="relative overflow-hidden">
          <img 
            src={heroImage} 
            alt="Casa moderna de lujo" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary/10" />
        </div>
        
        {/* Right Column - Content with solid purple background */}
        <div className="bg-primary flex items-center justify-center p-12">
          <div className="max-w-xl">
            <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-6">
              De terreno a casa sin estrés
            </h1>
            <p className="text-white/90 text-lg mb-8">
              Despacho de arquitectos y constructora con servicio 360°
            </p>
            <p className="text-white/80 text-base">
              Querétaro • San Luis Potosí
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverSlide;
