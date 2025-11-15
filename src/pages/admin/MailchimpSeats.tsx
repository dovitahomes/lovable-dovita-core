import { useState } from "react";
import { useMailchimpSeats } from "@/hooks/useMailchimpSeats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserPlus, Trash2, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MailchimpSeats() {
  const { seats, isLoading, activeSeats, totalSeats, createSeat, deactivateSeat, isCreating, isDeactivating } = useMailchimpSeats();
  
  const [isAddingGeneric, setIsAddingGeneric] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [genericEmail, setGenericEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState("");
  const [seatToDelete, setSeatToDelete] = useState<string | null>(null);

  // Obtener lista de colaboradores (usuarios que no son clientes)
  const { data: collaborators } = useQuery({
    queryKey: ['collaborators-for-seats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email
        `);

      if (error) throw error;

      // Filtrar usuarios que ya tienen asiento asignado
      const assignedUserIds = seats.filter(s => s.user_id).map(s => s.user_id);
      return data?.filter(user => !assignedUserIds.includes(user.id)) || [];
    },
    enabled: isAddingUser,
  });

  const handleAddGeneric = () => {
    if (!genericEmail.trim()) {
      toast.error("Por favor, ingresa un email válido");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(genericEmail)) {
      toast.error("Email inválido");
      return;
    }

    createSeat({
      mailchimp_email: genericEmail.trim(),
      seat_type: 'generic',
    });

    setGenericEmail("");
    setIsAddingGeneric(false);
  };

  const handleAddUser = () => {
    if (!selectedUserId) {
      toast.error("Por favor, selecciona un usuario");
      return;
    }

    if (!userEmail.trim()) {
      toast.error("Por favor, ingresa un email válido");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      toast.error("Email inválido");
      return;
    }

    createSeat({
      user_id: selectedUserId,
      mailchimp_email: userEmail.trim(),
      seat_type: 'user',
    });

    setSelectedUserId("");
    setUserEmail("");
    setIsAddingUser(false);
  };

  const handleDelete = () => {
    if (seatToDelete) {
      deactivateSeat(seatToDelete);
      setSeatToDelete(null);
    }
  };

  const genericSeat = seats.find(s => s.seat_type === 'generic');
  const userSeats = seats.filter(s => s.seat_type === 'user');

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Asientos Mailchimp</h1>
          <p className="text-muted-foreground">
            Gestiona los asientos de Mailchimp para envío de emails personalizados
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Asientos Mailchimp</h1>
        <p className="text-muted-foreground">
          Gestiona los asientos de Mailchimp para envío de emails personalizados
        </p>
      </div>

      {/* Resumen de asientos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
          <CardDescription>
            Estado actual de asientos Mailchimp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={activeSeats >= totalSeats ? "destructive" : "default"} className="text-lg px-4 py-2">
              {activeSeats} / {totalSeats} Asientos Asignados
            </Badge>
            {activeSeats >= totalSeats && (
              <p className="text-sm text-destructive">
                Límite alcanzado. Desactiva un asiento para agregar uno nuevo.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Asiento Genérico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Genérico
          </CardTitle>
          <CardDescription>
            Email genérico de la empresa (usado cuando usuarios no tienen asiento personal)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {genericSeat ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{genericSeat.mailchimp_email}</p>
                <p className="text-sm text-muted-foreground">Asiento genérico</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setSeatToDelete(genericSeat.id)}
                disabled={isDeactivating}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Desactivar
              </Button>
            </div>
          ) : isAddingGeneric ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="generic-email">Email Genérico de Mailchimp</Label>
                <Input
                  id="generic-email"
                  type="email"
                  value={genericEmail}
                  onChange={(e) => setGenericEmail(e.target.value)}
                  placeholder="info@ejemplo.com"
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddGeneric} disabled={isCreating}>
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setIsAddingGeneric(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAddingGeneric(true)} disabled={activeSeats >= totalSeats}>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Email Genérico
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Asientos de Usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Asientos Personales ({userSeats.length})
          </CardTitle>
          <CardDescription>
            Asientos asignados a usuarios específicos para envío desde su email personal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAddingUser ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="user-select">Usuario</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user-select">
                    <SelectValue placeholder="Selecciona un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user-email">Email de Mailchimp</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="usuario@mailchimp.com"
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddUser} disabled={isCreating || !selectedUserId}>
                  Asignar Asiento
                </Button>
                <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsAddingUser(true)} disabled={activeSeats >= totalSeats}>
              <UserPlus className="h-4 w-4 mr-2" />
              Asignar Nuevo Asiento
            </Button>
          )}

          {userSeats.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email Mailchimp</TableHead>
                  <TableHead>Fecha Asignación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSeats.map((seat) => (
                  <TableRow key={seat.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{seat.profiles?.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">{seat.profiles?.email || 'Sin email'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{seat.mailchimp_email}</TableCell>
                    <TableCell>{new Date(seat.created_at).toLocaleDateString('es-MX')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSeatToDelete(seat.id)}
                        disabled={isDeactivating}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!seatToDelete} onOpenChange={() => setSeatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar asiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el asiento. El usuario no podrá enviar emails desde su email personal de Mailchimp.
              Podrás asignar este asiento a otro usuario más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Desactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
