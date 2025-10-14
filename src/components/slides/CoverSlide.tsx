import Logo from "../Logo";

const CoverSlide = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary-light relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="relative z-10 text-center px-6">
        <Logo size="large" className="mx-auto mb-8" />
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Presentación Corporativa
        </h1>
        <p className="text-xl md:text-2xl text-white/90">
          De terreno a casa sin estrés
        </p>
      </div>
    </div>
  );
};

export default CoverSlide;
