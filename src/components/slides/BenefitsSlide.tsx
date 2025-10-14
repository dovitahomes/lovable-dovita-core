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
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <img 
              src={familyImage} 
              alt="Familia feliz en su nuevo hogar" 
              className="rounded-2xl shadow-2xl w-full h-96 object-cover mb-8"
            />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4 text-center">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Beneficios que nos hacen únicos en el mercado
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-6 rounded-lg hover:bg-muted/50 transition-all group"
              >
                <CheckCircle2 className="h-7 w-7 text-secondary flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <span className="text-lg text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-8 bg-primary/10 rounded-2xl border-2 border-primary/20">
            <p className="text-xl text-center font-medium">
              <span className="text-primary font-bold">Construir con Dovita</span> es más que levantar paredes, 
              es crear el hogar de tus sueños con la confianza de que cada detalle está bajo control.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-primary py-4">
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
