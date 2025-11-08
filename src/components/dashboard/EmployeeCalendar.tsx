import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { useCalendarEventsByMonth, useCreateCalendarEvent, useDeleteCalendarEvent } from "@/hooks/useEmployeeCalendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";

export function EmployeeCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const month = selectedDate?.getMonth() || new Date().getMonth();
  const year = selectedDate?.getFullYear() || new Date().getFullYear();
  
  const { data: events, isLoading } = useCalendarEventsByMonth(year, month);
  const createMutation = useCreateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "reunion" as "reunion" | "vacaciones" | "curso" | "personal",
  });

  // Get current user
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  });

  const eventsOnSelectedDate = events?.filter((event) => {
    const eventDate = new Date(event.fecha_inicio);
    return (
      selectedDate &&
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const datesWithEvents = events?.map((event) => new Date(event.fecha_inicio)) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;

    await createMutation.mutateAsync({
      user_id: currentUserId,
      ...formData,
    });

    setIsDialogOpen(false);
    setFormData({
      titulo: "",
      descripcion: "",
      fecha_inicio: "",
      fecha_fin: "",
      tipo: "reunion",
    });
  };

  const getEventTypeColor = (tipo: string) => {
    switch (tipo) {
      case "reunion":
        return "bg-primary/10 text-primary border-primary/20";
      case "vacaciones":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "curso":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "personal":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default:
        return "bg-muted";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Mi Calendario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            Mi Calendario
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reunion">Reunión</SelectItem>
                      <SelectItem value="vacaciones">Vacaciones</SelectItem>
                      <SelectItem value="curso">Curso</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                    <Input
                      id="fecha_inicio"
                      type="datetime-local"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_fin">Fecha Fin (Opcional)</Label>
                    <Input
                      id="fecha_fin"
                      type="datetime-local"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creando..." : "Crear Evento"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{
            hasEvent: datesWithEvents,
          }}
          modifiersStyles={{
            hasEvent: {
              fontWeight: "bold",
              textDecoration: "underline",
            },
          }}
          className="rounded-md border"
        />

        {eventsOnSelectedDate && eventsOnSelectedDate.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">
              Eventos del {selectedDate?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
            </h4>
            <div className="space-y-2">
              {eventsOnSelectedDate.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border flex items-start justify-between ${getEventTypeColor(event.tipo)}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{event.titulo}</h5>
                      <Badge variant="outline" className="text-xs">
                        {event.tipo}
                      </Badge>
                    </div>
                    {event.descripcion && (
                      <p className="text-xs mt-1 opacity-80">{event.descripcion}</p>
                    )}
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(event.fecha_inicio).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {event.fecha_fin &&
                        ` - ${new Date(event.fecha_fin).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-60 hover:opacity-100"
                    onClick={() => deleteMutation.mutate(event.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!eventsOnSelectedDate || eventsOnSelectedDate.length === 0) && selectedDate && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No hay eventos programados para este día
          </p>
        )}
      </CardContent>
    </Card>
  );
}
