import { CheckCircle2 } from "lucide-react";
import Logo from "../Logo";
import familyImage from "@/assets/happy-family.jpg";

const benefits = [
  "Transparencia total en costos y tiempos",
  "Comunicación constante con el equipo",
  "Visualización 3D y realidad virtual de tu proyecto",
  "Seguimiento en tiempo real del avance de obra",
  "Control financiero completo desde tu dispositivo",
  "Equipo profesional de arquitectos e ingenieros",
  "Materiales de primera calidad garantizados",
  "Asesoría personalizada en cada etapa"
];

const BenefitsSlide = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-12 py-20 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20 items-center mb-20">
            <div>
              <h2 className="text-6xl md:text-7xl font-bold text-primary mb-6 leading-none">
                ¿Por qué<br />elegirnos?
              </h2>
              <p className="text-2xl text-muted-foreground">
                Beneficios que nos hacen únicos en el mercado
              </p>
            </div>
            
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <img 
                src={familyImage} 
                alt="Familia feliz en su nuevo hogar" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-4"
              >
                <CheckCircle2 className="h-7 w-7 text-secondary flex-shrink-0 mt-1" />
                <span className="text-xl text-foreground/80">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 border-t border-white/10">
        <div className="container mx-auto px-6">
          <p className="text-center text-white text-sm">
            Tu satisfacción es nuestra prioridad
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenefitsSlide;
