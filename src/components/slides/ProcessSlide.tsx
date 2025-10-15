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
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="flex-1 grid md:grid-cols-5">
        {/* Left side - Image (2 columns) */}
        <div className="md:col-span-2 relative overflow-hidden">
          <img 
            src={processImage} 
            alt="Avance de construcción" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Right side - Content (3 columns) */}
        <div className="md:col-span-3 bg-primary p-16 overflow-y-auto">
          <div className="max-w-3xl">
            <span className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4 block">
              Proceso
            </span>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-12">
              Nuestro Proceso
            </h2>
            
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-secondary flex items-center justify-center text-primary font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 text-white">
                      {step.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSlide;
