import Logo from "../Logo";
import vrOption1 from "@/assets/vr-option-1.jpg";
import vrOption2 from "@/assets/vr-option-2.jpg";
import vrOption3 from "@/assets/vr-option-3.jpg";
import vrOption4 from "@/assets/vr-option-4.jpg";

const imageOptions = [
  { src: vrOption1, title: "Opción 1", description: "Cliente con VR explorando render de casa moderna" },
  { src: vrOption2, title: "Opción 2", description: "Visualización holográfica de render arquitectónico" },
  { src: vrOption3, title: "Opción 3", description: "Comparación VR y render 3D de proyecto residencial" },
  { src: vrOption4, title: "Opción 4", description: "Espacio de trabajo con tecnología VR y renders" },
];

const ImageOptionsSlide = () => {
  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="container mx-auto px-6 py-3">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-2">
            Opciones de Imágenes para "Quiénes Somos"
          </h2>
          <p className="text-foreground/70 mb-8">
            Elige la imagen que mejor represente la integración de VR con los renders de tus proyectos
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {imageOptions.map((option, index) => (
              <div key={index} className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={option.src} 
                    alt={option.description}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold text-primary mb-1">{option.title}</h3>
                  <p className="text-sm text-foreground/70">{option.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOptionsSlide;
