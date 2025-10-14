import { CheckCircle2 } from "lucide-react";
import Logo from "../Logo";

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
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-6 py-12">
        <Logo className="mb-12" />
        
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Beneficios que nos hacen únicos en el mercado
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex items-start gap-4 p-6 rounded-lg hover:bg-muted/50 transition-all group"
              >
                <CheckCircle2 className="h-7 w-7 text-primary flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
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
    </div>
  );
};

export default BenefitsSlide;
