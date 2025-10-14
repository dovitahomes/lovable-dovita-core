import logo from "@/assets/logo-dovita.png";

interface LogoProps {
  size?: "small" | "large";
  className?: string;
}

const Logo = ({ size = "small", className = "" }: LogoProps) => {
  const sizeClass = size === "large" ? "h-24 md:h-32" : "h-10 md:h-12";
  
  return (
    <img 
      src={logo} 
      alt="Dovita - De terreno a casa sin estrés" 
      className={`${sizeClass} w-auto object-contain ${className}`}
    />
  );
};

export default Logo;
