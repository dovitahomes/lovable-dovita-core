import Logo from "../Logo";
import constructionImage from "@/assets/construction-progress.jpg";

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
      {/* Header */}
      <div className="bg-primary border-b-4 border-secondary">
        <div className="container mx-auto px-6 py-4">
          <Logo className="brightness-0 invert" />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                Nuestro Proceso
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                5 pasos para hacer realidad tu hogar
              </p>
              
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div 
                    key={index}
                    className="flex gap-4 items-start group hover:bg-muted/50 p-4 rounded-lg transition-all"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xl font-bold text-primary-foreground">{step.number}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative mt-8 md:mt-0">
              <img 
                src={constructionImage} 
                alt="Proceso de construcción" 
                className="rounded-2xl shadow-2xl w-full h-auto"
              />
              <div className="absolute -top-6 -right-6 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSlide;
