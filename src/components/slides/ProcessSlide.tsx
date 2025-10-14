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
    <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/30 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-primary/10">
        <div className="container mx-auto px-6 py-4">
          <Logo />
        </div>
      </div>
      
      <div className="container mx-auto px-6 py-16 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-semibold rounded-full text-sm border border-primary/20">
              Proceso
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent mb-12">
            Nuestro Proceso
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-start mb-12">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4 group relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300" />
                  <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {step.number}
                  </div>
                  <div className="relative">
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
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              <img 
                src={progressImage} 
                alt="Avance de construcción" 
                className="relative rounded-3xl shadow-2xl w-full h-auto sticky top-24"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gradient-to-r from-primary to-primary-dark py-4 border-t border-white/10">
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
