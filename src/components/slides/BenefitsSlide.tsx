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
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="relative group mb-12">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <img 
              src={familyImage} 
              alt="Familia feliz en su nuevo hogar" 
              className="relative rounded-3xl shadow-2xl w-full h-96 object-cover"
            />
          </div>
          
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-semibold rounded-full text-sm border border-primary/20">
              Beneficios
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-4">
            Fortalezas Dovita
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            Diseñamos y construimos hogares que superan expectativas, haciendo que el proceso sea sencillo, seguro y emocionante
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300" />
                <div className="relative flex items-start gap-4 p-6 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-secondary flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                  <span className="text-lg text-foreground">{benefit}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-8 bg-gradient-to-r from-primary/5 to-accent/5 rounded-3xl border-2 border-primary/10">
            <p className="text-xl text-center font-medium">
              <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent font-bold">Con Dovita tienes el control en tus manos</span> desde el diseño hasta la entrega. 
              Transformamos terrenos en hogares sin estrés, donde tu casa se convierte en nuestra experiencia.
            </p>
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
