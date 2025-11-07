import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

interface EmergencyContactFormProps {
  value: EmergencyContact | null;
  onChange: (value: EmergencyContact) => void;
}

export function EmergencyContactForm({ value, onChange }: EmergencyContactFormProps) {
  const contact = value || {};
  
  const handleChange = (field: keyof EmergencyContact, val: string) => {
    onChange({
      ...contact,
      [field]: val,
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="emergency-name">Nombre del Contacto</Label>
        <Input
          id="emergency-name"
          value={contact.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ej: María López"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="emergency-phone">Teléfono</Label>
        <Input
          id="emergency-phone"
          value={contact.phone || ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="Ej: 444-123-4567"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="emergency-relationship">Relación</Label>
        <Input
          id="emergency-relationship"
          value={contact.relationship || ''}
          onChange={(e) => handleChange('relationship', e.target.value)}
          placeholder="Ej: Esposa, Hermano, Padre"
        />
      </div>
    </div>
  );
}
