import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface VoiceToTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function VoiceToTextInput({ value, onChange, placeholder }: VoiceToTextInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'es-MX';

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onChange(value + (value ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Error al reconocer voz');
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Escuchando... Habla ahora');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Descripción (opcional)</Label>
        {recognition && (
          <Button
            type="button"
            variant={isListening ? "default" : "outline"}
            size="sm"
            onClick={toggleListening}
            className="h-8"
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4 mr-2" />
                Detener
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Voz
              </>
            )}
          </Button>
        )}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Ej: Instalación de fontanería terminada"}
        rows={3}
        className="resize-none"
      />
    </div>
  );
}
