import Logo from "../Logo";
import appDashboard from "@/assets/app-dashboard.png";
import appPhotos from "@/assets/app-photos.png";
import appChat from "@/assets/app-chat.png";

const platformFeatures = [
  {
    image: appDashboard,
    title: "Portal del Cliente",
    description: "Dashboard completo con información del proyecto, presupuestos y cronogramas en tiempo real"
  },
  {
    image: appPhotos,
    title: "Fotos de Progreso",
    description: "Galería de avances con categorización automática y actualizaciones semanales de obra"
  },
  {
    image: appChat,
    title: "Comunicación Directa",
    description: "Chat integrado y seguimiento financiero transparente de cada peso invertido"
  }
];

const TechnologySlide = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <span className="text-primary/70 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Innovación
            </span>
            
            <h2 className="text-4xl md:text-5xl font-bold text-primary mb-3">
              Tecnología de Vanguardia
            </h2>
            <p className="text-lg text-foreground/70 mb-12 max-w-2xl">
              Plataforma digital completa para que sigas cada detalle de tu proyecto
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {platformFeatures.map((feature, index) => (
                <div key={index} className="group">
                  {/* iPhone Frame */}
                  <div className="relative mb-4 mx-auto" style={{ maxWidth: '300px' }}>
                    {/* iPhone body */}
                    <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10"></div>
                      
                      {/* Screen */}
                      <div className="relative overflow-hidden rounded-[2.5rem] aspect-[9/19.5] bg-white">
                        <img 
                          src={feature.image} 
                          alt={feature.title}
                          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      
                      {/* Home indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-primary text-center">{feature.title}</h3>
                  <p className="text-foreground/70 leading-relaxed text-sm text-center">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologySlide;
