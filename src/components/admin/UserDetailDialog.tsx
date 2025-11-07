import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useUserById } from '@/hooks/useUserById';
import { useUpdateUserProfile } from '@/hooks/useUpdateUserProfile';
import { UserDocumentsTab } from './UserDocumentsTab';
import { EmergencyContactForm } from './EmergencyContactForm';
import { UserRoleBadges } from './UserRoleBadges';
import { User, Calendar, Building, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ userId, open, onOpenChange }: UserDetailDialogProps) {
  const { data: user, isLoading } = useUserById(userId);
  const updateMutation = useUpdateUserProfile();
  
  // Fetch sucursales for dropdown
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sucursales')
        .select('*')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });
  
  const [formData, setFormData] = useState<any>({});
  
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
        rfc: user.rfc || '',
        imss_number: user.imss_number || '',
        fecha_ingreso: user.fecha_ingreso || '',
        emergency_contact: user.emergency_contact || null,
        sucursal_id: user.sucursal_id || '',
      });
    }
  }, [user]);
  
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  
  const handleSave = async () => {
    if (!userId) return;
    await updateMutation.mutateAsync({ userId, data: formData });
  };
  
  const isClient = user?.roles?.includes('cliente');
  
  if (!open || !userId) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Usuario</DialogTitle>
        </DialogHeader>
        
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Cargando...</div>
        )}
        
        {!isLoading && user && (
          <div className="grid grid-cols-1 md:grid-cols-[300px,1fr] gap-6">
            {/* Left Column - Avatar and Basic Info */}
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-40 h-40">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="w-full space-y-2">
                  <Label htmlFor="full-name">Nombre Completo</Label>
                  <Input
                    id="full-name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                  />
                </div>
                
                <div className="w-full space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>
                
                <div className="w-full space-y-2">
                  <Label>Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="default">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Card className="w-full p-3 space-y-2 bg-muted/50">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Creado:</span>
                    <span className="font-medium">
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}
                    </span>
                  </div>
                  {user.fecha_nacimiento && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cumpleaños:</span>
                      <span className="font-medium">
                        {format(new Date(user.fecha_nacimiento), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  )}
                </Card>
              </div>
            </div>
            
            {/* Right Column - Tabs */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="laboral">Información Laboral</TabsTrigger>
                <TabsTrigger value="documentos">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-nacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha-nacimiento"
                      type="date"
                      value={formData.fecha_nacimiento}
                      onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Ej: 444-123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC</Label>
                    <Input
                      id="rfc"
                      value={formData.rfc}
                      onChange={(e) => handleChange('rfc', e.target.value)}
                      placeholder="Ej: XAXX010101000"
                    />
                  </div>
                  
                  {!isClient && (
                    <div className="space-y-2">
                      <Label htmlFor="imss">Número de IMSS</Label>
                      <Input
                        id="imss"
                        value={formData.imss_number}
                        onChange={(e) => handleChange('imss_number', e.target.value)}
                        placeholder="Ej: 12345678901"
                      />
                    </div>
                  )}
                </div>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Contacto de Emergencia</h3>
                  <EmergencyContactForm
                    value={formData.emergency_contact}
                    onChange={(value) => handleChange('emergency_contact', value)}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="laboral" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {!isClient && (
                    <div className="space-y-2">
                      <Label htmlFor="fecha-ingreso">Fecha de Ingreso</Label>
                      <Input
                        id="fecha-ingreso"
                        type="date"
                        value={formData.fecha_ingreso}
                        onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="sucursal">Sucursal</Label>
                    <Select value={formData.sucursal_id} onValueChange={(value) => handleChange('sucursal_id', value)}>
                      <SelectTrigger id="sucursal">
                        <SelectValue placeholder="Seleccionar sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((sucursal) => (
                          <SelectItem key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Roles del Sistema</h3>
                  <UserRoleBadges
                    userId={userId}
                    currentRoles={user.roles as any}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="documentos" className="mt-4">
                <UserDocumentsTab userId={userId} />
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
