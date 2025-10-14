import Logo from "../Logo";

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
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-6 py-12">
        <Logo className="mb-12" />
        
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Nuestro Proceso
          </h2>
          <p className="text-xl text-muted-foreground mb-12">
            5 pasos para hacer realidad tu hogar
          </p>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="flex gap-6 items-start group hover:bg-muted/50 p-6 rounded-lg transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSlide;
