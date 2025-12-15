import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ResponsiveTable, Column } from '@/components/common/ResponsiveTable';
import { UserDetailDialog } from '@/components/admin/UserDetailDialog';
import { UserPlus, Key, Mail, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { inviteUser, sendPasswordReset, deleteUser } from '@/lib/userManagement';
import { LoadingError } from '@/components/common/LoadingError';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserCardMobile } from '@/components/admin/UserCardMobile';
import { cn } from '@/lib/utils';
import { getAvatarPublicUrl } from '@/lib/storage/avatar-url';

export default function GestionUsuarios() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: any | null }>({
    open: false,
    user: null,
  });
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{
    email: string;
    full_name: string;
    phone: string;
    role: 'admin' | 'colaborador' | 'contador' | 'cliente';
  }>({
    email: '',
    full_name: '',
    phone: '',
    role: 'colaborador',
  });
  
  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_users_extended')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch sucursales for invite form
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
  
  // Mutations
  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Usuario invitado exitosamente');
      setInviteDialogOpen(false);
      setInviteForm({ email: '', full_name: '', phone: '', role: 'colaborador' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al invitar usuario');
    },
  });
  
  const resetPasswordMutation = useMutation({
    mutationFn: sendPasswordReset,
    onSuccess: () => {
      toast.success('Email de recuperación enviado');
    },
    onError: () => {
      toast.error('Error al enviar email de recuperación');
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      toast.success('Usuario eliminado exitosamente');
      setDeleteDialog({ open: false, user: null });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al eliminar usuario');
    },
  });
  
  const handleRowClick = (user: any) => {
    setSelectedUserId(user.id);
    setDetailDialogOpen(true);
  };
  
  const handleResetPassword = async (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await resetPasswordMutation.mutateAsync(email);
  };
  
  const handleDelete = async () => {
    if (!deleteDialog.user) return;
    
    // Verificar si es el último admin
    const isAdmin = deleteDialog.user.roles?.includes('admin');
    const adminCount = users.filter(u => u.roles?.includes('admin')).length;
    
    if (isAdmin && adminCount <= 1) {
      toast.error('No se puede eliminar el último administrador del sistema');
      setDeleteDialog({ open: false, user: null });
      return;
    }
    
    await deleteMutation.mutateAsync(deleteDialog.user.id);
  };
  
  const handleInvite = async () => {
    await inviteMutation.mutateAsync(inviteForm);
  };
  
  // Filter users
  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.roles?.some((role: string) => role.toLowerCase().includes(search))
    );
  });
  
  const columns: Column<any>[] = [
    {
      key: 'id' as any,
      header: '',
      render: (_: any, user: any) => (
        <Avatar className="w-10 h-10">
          <AvatarImage src={getAvatarPublicUrl(user.avatar_url)} />
          <AvatarFallback>
            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: 'full_name' as any,
      header: 'Nombre',
      render: (_: any, user: any) => (
        <div>
          <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'roles' as any,
      header: 'Roles',
      render: (_: any, user: any) => (
        <div className="flex flex-wrap gap-1">
          {user.roles?.map((role: string) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'sucursal_nombre' as any,
      header: 'Sucursal',
      render: (_: any, user: any) => user.sucursal_nombre || '-',
    },
  ];
  
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Error al cargar usuarios</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className={cn(
            "flex items-center justify-between",
            isMobile ? "flex-col gap-3 items-stretch" : "flex-row"
          )}>
            <CardTitle className={cn(
              "font-bold",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              Gestión de Usuarios
            </CardTitle>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className={isMobile ? "w-full" : ""}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isMobile ? 'Invitar' : 'Invitar Usuario'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email *</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-name">Nombre Completo</Label>
                    <Input
                      id="invite-name"
                      value={inviteForm.full_name}
                      onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-phone">Teléfono</Label>
                    <Input
                      id="invite-phone"
                      value={inviteForm.phone}
                      onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                      placeholder="444-123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Rol *</Label>
                    <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as 'admin' | 'colaborador' | 'contador' | 'cliente' })}>
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="colaborador">Colaborador</SelectItem>
                        <SelectItem value="contador">Contador</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleInvite} disabled={inviteMutation.isPending || !inviteForm.email}>
                      {inviteMutation.isPending ? 'Invitando...' : 'Enviar Invitación'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={isMobile ? "Buscar..." : "Buscar por nombre, email o rol..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("pl-10", isMobile && "text-base")}
              type="search"
              autoComplete="off"
              autoCapitalize="none"
            />
          </div>
          
          {isMobile ? (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <UserCardMobile
                  key={user.id}
                  user={user}
                  onView={() => handleRowClick(user)}
                  onResetPassword={() => resetPasswordMutation.mutate(user.email)}
                  onResendInvite={() => resetPasswordMutation.mutate(user.email)}
                  onDelete={() => setDeleteDialog({ open: true, user })}
                />
              ))}
            </div>
          ) : (
            <ResponsiveTable
            data={filteredUsers}
            columns={columns}
            keyExtractor={(user: any) => user.id}
            onRowClick={handleRowClick}
            actions={(user: any) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPassword(user.email, e);
                  }}
                  disabled={resetPasswordMutation.isPending}
                  title="Restablecer contraseña"
                >
                  <Key className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetPassword(user.email, e);
                  }}
                  title="Reenviar invitación"
                >
                  <Mail className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialog({ open: true, user });
                  }}
                  title="Eliminar usuario"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            )}
            />
          )}
        </CardContent>
      </Card>
      
      <UserDetailDialog
        userId={selectedUserId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
      
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a "{deleteDialog.user?.full_name || deleteDialog.user?.email}"? 
              Esta acción eliminará permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>El usuario de autenticación</li>
                <li>Su perfil y datos personales</li>
                <li>Sus roles y permisos</li>
                <li>Sus documentos asociados</li>
              </ul>
              <p className="mt-2 font-semibold text-destructive">Esta acción no se puede deshacer.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
