import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SlideNavigation from "@/components/SlideNavigation";
import CoverSlide from "@/components/slides/CoverSlide";
import AboutSlide from "@/components/slides/AboutSlide";
import ServicesSlide from "@/components/slides/ServicesSlide";
import ProcessSlide from "@/components/slides/ProcessSlide";
import TechnologySlide from "@/components/slides/TechnologySlide";
import BenefitsSlide from "@/components/slides/BenefitsSlide";
import ContactSlide from "@/components/slides/ContactSlide";

const slides = [
  CoverSlide,
  AboutSlide,
  ServicesSlide,
  ProcessSlide,
  TechnologySlide,
  BenefitsSlide,
  ContactSlide
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const CurrentSlideComponent = slides[currentSlide];

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <CurrentSlideComponent />
        </motion.div>
      </AnimatePresence>

      <SlideNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        onNext={handleNext}
        onPrev={handlePrev}
      />
    </div>
  );
};

export default Index;
