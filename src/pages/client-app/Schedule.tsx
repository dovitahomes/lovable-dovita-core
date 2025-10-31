import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const phases = [
  { 
    id: 1, 
    name: 'Diseño Arquitectónico', 
    status: 'completed', 
    progress: 100,
    startDate: '15 Mar 2024',
    endDate: '30 Mar 2024'
  },
  { 
    id: 2, 
    name: 'Permisos y Licencias', 
    status: 'completed', 
    progress: 100,
    startDate: '1 Abr 2024',
    endDate: '5 Abr 2024'
  },
  { 
    id: 3, 
    name: 'Cimentación', 
    status: 'completed', 
    progress: 100,
    startDate: '8 Abr 2024',
    endDate: '25 Abr 2024'
  },
  { 
    id: 4, 
    name: 'Estructura', 
    status: 'in-progress', 
    progress: 45,
    startDate: '28 Abr 2024',
    endDate: '30 May 2024'
  },
  { 
    id: 5, 
    name: 'Instalaciones', 
    status: 'pending', 
    progress: 0,
    startDate: '1 Jun 2024',
    endDate: '30 Jun 2024'
  },
  { 
    id: 6, 
    name: 'Acabados', 
    status: 'pending', 
    progress: 0,
    startDate: '1 Jul 2024',
    endDate: '31 Ago 2024'
  },
  { 
    id: 7, 
    name: 'Entrega', 
    status: 'pending', 
    progress: 0,
    startDate: '1 Sep 2024',
    endDate: '15 Sep 2024'
  },
];

export default function Schedule() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Cronograma de Obra</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seguimiento de las fases del proyecto
        </p>
      </div>

      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        {phases.map((phase, index) => (
          <Card key={phase.id} className="relative ml-10">
            {/* Timeline dot */}
            <div className="absolute -left-10 top-6 w-10 flex items-center justify-start">
              {phase.status === 'completed' ? (
                <CheckCircle2 className="h-10 w-10 text-green-600 bg-background" />
              ) : phase.status === 'in-progress' ? (
                <Clock className="h-10 w-10 text-primary bg-background" />
              ) : (
                <Circle className="h-10 w-10 text-muted-foreground bg-background" />
              )}
            </div>

            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{phase.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {phase.startDate} - {phase.endDate}
                  </p>
                </div>
                
                {phase.status === 'completed' && (
                  <Badge className="bg-green-100 text-green-700">Completada</Badge>
                )}
                {phase.status === 'in-progress' && (
                  <Badge className="bg-blue-100 text-blue-700">En Proceso</Badge>
                )}
                {phase.status === 'pending' && (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
              </div>

              {phase.status === 'in-progress' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="font-semibold text-primary">{phase.progress}%</span>
                  </div>
                  <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
