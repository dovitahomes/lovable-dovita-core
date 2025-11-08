import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LoadingError } from '@/components/common/LoadingError';
import { EmergencyRollbackButton } from '@/components/admin/EmergencyRollbackButton';
import { useModuleAccess } from '@/hooks/useModuleAccess';

const AVAILABLE_MODULES = [
  // Principal
  { id: 'dashboard', name: 'Dashboard' },
  
  // CRM
  { id: 'leads', name: 'Leads' },
  { id: 'clientes', name: 'Clientes' },
  
  // Proyectos
  { id: 'proyectos', name: 'Proyectos' },
  { id: 'diseno', name: 'Diseño' },
  { id: 'presupuestos', name: 'Presupuestos' },
  { id: 'cronograma', name: 'Cronograma de Gantt' },
  { id: 'construccion', name: 'Construcción' },
  
  // Abastecimiento
  { id: 'proveedores', name: 'Proveedores' },
  { id: 'ordenes_compra', name: 'Órdenes de Compra' },
  { id: 'lotes_pago', name: 'Lotes de Pago' },
  
  // Finanzas
  { id: 'finanzas', name: 'Finanzas' },
  { id: 'contabilidad', name: 'Contabilidad' },
  { id: 'comisiones', name: 'Comisiones' },
  
  // Gestión / Herramientas
  { id: 'usuarios', name: 'Usuarios' },
  { id: 'accesos', name: 'Accesos' },
  { id: 'identidades', name: 'Identidades' },
  { id: 'contenido_corporativo', name: 'Contenido Corporativo' },
  { id: 'sucursales', name: 'Sucursales' },
  { id: 'centro_reglas', name: 'Centro de Reglas' },
  { id: 'herramientas', name: 'Herramientas (General)' },
];

type UserBasic = {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
};

type Permission = {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export default function Accesos() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { can } = useModuleAccess();
  const isAdmin = can("accesos", "delete"); // Solo admins pueden hacer rollback

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['vw_users_with_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_users_with_roles')
        .select('*')
        .order('email');
      
      if (error) throw error;
      return data as UserBasic[];
    },
  });

  // Fetch permissions for selected user
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['user_permissions', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', selectedUserId);
      
      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!selectedUserId,
  });

  // Update user roles mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: string[] }) => {
      const { error } = await supabase.rpc('admin_set_user_roles', {
        target_user_id: userId,
        roles: roles,
      });
      
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({
        title: 'Éxito',
        description: 'Roles actualizados correctamente',
      });
      
      // Invalidate all permission-related queries
      queryClient.invalidateQueries({ queryKey: ['vw_users_with_roles'] });
      queryClient.invalidateQueries({ queryKey: ['user_permissions', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['user-module-permissions'] });
      
      // Refresh localStorage if current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === selectedUserId) {
        // Wait for changes to propagate
        setTimeout(() => window.location.reload(), 500);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUserChange = (userId: string) => {
    setSelectedUserId(userId);
    const user = users?.find(u => u.id === userId);
    setSelectedRoles(user?.roles || []);
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    setSelectedRoles(prev => 
      checked ? [...prev, role] : prev.filter(r => r !== role)
    );
  };

  const handleSave = () => {
    if (!selectedUserId) return;
    updatePermissionMutation.mutate({ 
      userId: selectedUserId, 
      roles: selectedRoles 
    });
  };

  const getPermissionValue = (moduleName: string, field: keyof Permission) => {
    const perm = permissions?.find(p => p.module_name === moduleName);
    return perm ? perm[field] : false;
  };

  if (usersError) {
    return (
      <LoadingError 
        error={usersError instanceof Error ? usersError : new Error('Error cargando usuarios')}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['vw_users_with_roles'] })}
      />
    );
  }

  const selectedUser = users?.find(u => u.id === selectedUserId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Accesos</h1>
          <p className="text-muted-foreground mt-2">
            Asigna roles y permisos a los usuarios del sistema
          </p>
        </div>
        
        {isAdmin && <EmergencyRollbackButton />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Usuario</CardTitle>
          <CardDescription>
            Elige un usuario para gestionar sus roles y permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedUserId} onValueChange={handleUserChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un usuario..." />
            </SelectTrigger>
            <SelectContent>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.email} {user.full_name && `(${user.full_name})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUser && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Roles de {selectedUser.email}</CardTitle>
              <CardDescription>
                Los roles determinan el nivel de acceso del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-admin"
                  checked={selectedRoles.includes('admin')}
                  onCheckedChange={(checked) => handleRoleToggle('admin', checked as boolean)}
                />
                <Label htmlFor="role-admin" className="font-medium">
                  Administrador
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-colaborador"
                  checked={selectedRoles.includes('colaborador')}
                  onCheckedChange={(checked) => handleRoleToggle('colaborador', checked as boolean)}
                />
                <Label htmlFor="role-colaborador" className="font-medium">
                  Colaborador
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-contador"
                  checked={selectedRoles.includes('contador')}
                  onCheckedChange={(checked) => handleRoleToggle('contador', checked as boolean)}
                />
                <Label htmlFor="role-contador" className="font-medium">
                  Contador
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="role-cliente"
                  checked={selectedRoles.includes('cliente')}
                  onCheckedChange={(checked) => handleRoleToggle('cliente', checked as boolean)}
                />
                <Label htmlFor="role-cliente" className="font-medium">
                  Cliente
                </Label>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={updatePermissionMutation.isPending}
                className="w-full mt-4"
              >
                {updatePermissionMutation.isPending ? 'Guardando...' : 'Guardar Roles'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permisos por Módulo</CardTitle>
              <CardDescription>
                Vista de solo lectura de los permisos asignados según roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <p className="text-muted-foreground">Cargando permisos...</p>
              ) : permissions && permissions.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-4 font-medium text-sm border-b pb-2">
                    <div>Módulo</div>
                    <div className="text-center">Ver</div>
                    <div className="text-center">Crear</div>
                    <div className="text-center">Editar</div>
                    <div className="text-center">Eliminar</div>
                  </div>
                  {AVAILABLE_MODULES.map(module => {
                    const hasView = getPermissionValue(module.id, 'can_view');
                    if (!hasView) return null;
                    
                    return (
                      <div key={module.id} className="grid grid-cols-5 gap-4 py-2 border-b">
                        <div className="font-medium">{module.name}</div>
                        <div className="text-center">
                          <Checkbox checked={!!hasView} disabled />
                        </div>
                        <div className="text-center">
                          <Checkbox checked={!!getPermissionValue(module.id, 'can_create')} disabled />
                        </div>
                        <div className="text-center">
                          <Checkbox checked={!!getPermissionValue(module.id, 'can_edit')} disabled />
                        </div>
                        <div className="text-center">
                          <Checkbox checked={!!getPermissionValue(module.id, 'can_delete')} disabled />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No hay permisos asignados. Asigna roles para generar permisos automáticamente.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
