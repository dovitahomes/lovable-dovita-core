import Logo from "../Logo";
import progressImage from "@/assets/construction-progress.jpg";

const steps = [
  {
    number: "01",
    title: "Consulta Inicial",
    description: "Nos reunimos para entender tus necesidades, presupuesto y visión de tu hogar ideal."
  },
  {
    number: "02",
    title: "Diseño Arquitectónico",
    description: "Nuestros arquitectos crean el diseño perfecto. Lo visualizas en realidad virtual antes de aprobar."
  },
  {
    number: "03",
    title: "Planificación Financiera",
    description: "Establecemos un plan de pagos claro y transparente que se ajusta a tu presupuesto."
  },
  {
    number: "04",
    title: "Construcción",
    description: "Iniciamos la construcción. Tú sigues el avance desde nuestra plataforma con fotos y actualizaciones."
  },
  {
    number: "05",
    title: "Entrega",
    description: "Entregamos tu casa terminada, con todos los acabados y detalles acordados."
  }
];

const ProcessSlide = () => {
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
          <h2 className="text-4xl md:text-5xl font-bold text-primary mb-12">
            Nuestro Proceso
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-start mb-12">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary font-bold text-lg shadow-lg">
                    {step.number}
                  </div>
                  <div>
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
            
            <div className="relative">
              <img 
                src={progressImage} 
                alt="Avance de construcción" 
                className="rounded-2xl shadow-2xl w-full h-auto sticky top-24"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-primary py-4">
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
