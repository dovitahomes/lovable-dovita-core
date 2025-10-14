import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onNext: () => void;
  onPrev: () => void;
}

const SlideNavigation = ({ currentSlide, totalSlides, onNext, onPrev }: SlideNavigationProps) => {
  return (
    <div className="fixed bottom-8 right-8 flex items-center gap-4 z-50">
      <Button
        onClick={onPrev}
        disabled={currentSlide === 0}
        variant="secondary"
        size="icon"
        className="rounded-full shadow-lg"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="bg-card px-4 py-2 rounded-full shadow-lg border">
        <span className="font-medium">{currentSlide + 1} / {totalSlides}</span>
      </div>
      
      <Button
        onClick={onNext}
        disabled={currentSlide === totalSlides - 1}
        variant="secondary"
        size="icon"
        className="rounded-full shadow-lg"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default SlideNavigation;
