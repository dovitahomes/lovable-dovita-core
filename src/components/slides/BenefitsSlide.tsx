import { CheckCircle2 } from "lucide-react";
import Logo from "../Logo";
import familyImage from "@/assets/happy-family.jpg";

const benefits = [
  "Experiencia comprobada en diseño y construcción",
  "Alianzas estratégicas con proveedores de primera calidad",
  "Transparencia financiera total en costos y tiempos",
  "Atención postventa y garantías para tu tranquilidad",
  "Comunicación constante con el equipo",
  "Visualización 3D y realidad virtual de tu proyecto",
  "Seguimiento en tiempo real del avance de obra",
  "Control financiero completo desde tu dispositivo",
  "Equipo profesional de arquitectos e ingenieros",
  "Asesoría personalizada en cada etapa"
];

const BenefitsSlide = () => {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 grid md:grid-cols-2">
        {/* Left Column - Image */}
        <div className="relative overflow-hidden">
          <img 
            src={familyImage} 
            alt="Familia feliz en su nuevo hogar" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Right Column - Content */}
        <div className="bg-primary p-8 md:p-12 flex items-center overflow-y-auto">
          <div className="max-w-xl">
            <span className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Beneficios
            </span>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Fortalezas Dovita
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Diseñamos y construimos hogares que superan expectativas, haciendo que el proceso sea sencillo, seguro y emocionante
            </p>
            
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                  <span className="text-base text-white/90">{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
              <p className="text-base text-white/90">
                <span className="font-bold text-white">Con Dovita tienes el control en tus manos</span> desde el diseño hasta la entrega. 
                Transformamos terrenos en hogares sin estrés, donde tu casa se convierte en nuestra experiencia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSlide;
