import Logo from "../Logo";
import processImage from "@/assets/process-construction-bg.jpg";

const steps = [
  {
    number: "01",
    title: "Proceso de Diseño",
    description: "Máximo 50 días para diseñar tu casa. Arquitecto asignado dedicado a tu proyecto con personalización ilimitada. Diseños funcionales y preparados para las nuevas tecnologías."
  },
  {
    number: "02",
    title: "Presupuesto y Obra a Mano Alzada",
    description: "Certeza en costos antes de iniciar la obra. Transparencia en cada etapa. Apoyo en la obtención de créditos y plan de pagos a la medida."
  },
  {
    number: "03",
    title: "Construcción y Seguimiento",
    description: "Contrato de obra firmado con plazo fijo de construcción. Acceso digital a plataforma personalizada con avances de obra y aplicación de recursos en tiempo real."
  },
  {
    number: "04",
    title: "Entrega",
    description: "Entregamos tu casa terminada, con todos los acabados y detalles acordados. Reportes de obra y compromisos cumplidos en tiempo y forma."
  },
  {
    number: "05",
    title: "Postventa y Garantías",
    description: "Seguimiento posterior a la entrega. Garantías para tranquilidad total. Atención continua a nuestros clientes."
  }
];

const ProcessSlide = () => {
  return (
    <div className="min-h-screen w-full flex flex-col relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={processImage} 
          alt="Avance de construcción" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/85" />
      </div>
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10 relative z-10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 flex-1 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-white/80 backdrop-blur-sm text-primary font-semibold rounded-full text-sm border border-primary/20">
              Proceso
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-12">
            Nuestro Proceso
          </h2>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 group relative">
                <div className="absolute -inset-2 bg-white/80 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition duration-300 shadow-lg" />
                <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {step.number}
                </div>
                <div className="relative bg-white/70 backdrop-blur-sm p-4 rounded-xl flex-1 border border-primary/10 shadow-md">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 border-t border-white/10 relative z-10">
        <div className="container mx-auto px-6">
          <p className="text-center text-white text-sm">
            Un proceso transparente y eficiente de principio a fin
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessSlide;
