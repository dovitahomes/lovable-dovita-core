import Logo from "../Logo";
import platformDashboard from "@/assets/platform-dashboard.jpg";
import platformPhotos from "@/assets/platform-photos.jpg";
import platformChat from "@/assets/platform-chat.jpg";

const platformFeatures = [
  {
    image: platformDashboard,
    title: "Portal del Cliente",
    description: "Dashboard completo con información del proyecto, presupuestos y cronogramas en tiempo real"
  },
  {
    image: platformPhotos,
    title: "Fotos de Progreso",
    description: "Galería de avances con categorización automática y actualizaciones semanales de obra"
  },
  {
    image: platformChat,
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
                  <div className="relative overflow-hidden rounded-2xl shadow-lg mb-4 aspect-[9/16] bg-gray-100">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-primary">{feature.title}</h3>
                  <p className="text-foreground/70 leading-relaxed text-sm">{feature.description}</p>
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
