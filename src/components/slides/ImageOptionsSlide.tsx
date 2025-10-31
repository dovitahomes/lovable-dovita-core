import Logo from "../Logo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import familyOption1 from "@/assets/family-option-1.jpg";
import familyOption2 from "@/assets/family-option-2.jpg";
import familyOption3 from "@/assets/family-option-3.jpg";
import familyOption4 from "@/assets/family-option-4.jpg";

const imageOptions = [
  { src: familyOption1, title: "Opción 1", description: "Familia mexicana feliz en su nuevo hogar moderno" },
  { src: familyOption2, title: "Opción 2", description: "Familia celebrando en su nueva casa contemporánea" },
  { src: familyOption3, title: "Opción 3", description: "Momento familiar en el nuevo hogar" },
  { src: familyOption4, title: "Opción 4", description: "Familia orgullosa en su residencia moderna" },
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
            Opciones de Imágenes para "Fortalezas Dovita"
          </h2>
          <p className="text-foreground/70 mb-8">
            Elige la imagen que mejor represente a una familia mexicana feliz en su nuevo hogar
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
          
          {/* Client App Demo Link */}
          <div className="mt-12 text-center">
            <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-primary to-primary-light rounded-2xl text-white">
              <h3 className="text-2xl font-bold mb-3">
                Aplicación para Clientes
              </h3>
              <p className="mb-6 opacity-90">
                Explora nuestra plataforma móvil donde los clientes pueden ver el avance de su proyecto, gestionar pagos, comunicarse con el equipo y agendar citas.
              </p>
              <Link to="/app">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary font-semibold">
                  Ver Demo de la App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageOptionsSlide;
