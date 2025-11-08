import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserById } from '@/hooks/useUserById';
import { useUpdateUserProfile } from '@/hooks/useUpdateUserProfile';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { UserDocumentsTab } from './UserDocumentsTab';
import { EmergencyContactForm } from './EmergencyContactForm';
import { UserRoleBadges } from './UserRoleBadges';
import { useIsMobile } from '@/hooks/use-mobile';
import { User, Calendar, Building, Phone, IdCard, Briefcase, Camera, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ userId, open, onOpenChange }: UserDetailDialogProps) {
  const isMobile = useIsMobile();
  const { data: user, isLoading } = useUserById(userId);
  const updateMutation = useUpdateUserProfile();
  const uploadAvatar = useUploadAvatar();
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe pesar menos de 5MB');
        return;
      }
      
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten imágenes');
        return;
      }
      
      setAvatarFile(file);
      
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleUploadAvatar = async () => {
    if (!avatarFile || !userId) return;
    
    await uploadAvatar.mutateAsync({ userId, file: avatarFile });
    setAvatarFile(null);
    setAvatarPreview(null);
  };
  
  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const isClient = user?.roles?.includes('cliente');
  
  if (!open || !userId) return null;
  
  if (!open || !userId) return null;

  if (isLoading) {
    const loadingContent = (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="text-sm text-muted-foreground">Cargando información...</p>
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent>
            {loadingContent}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          {loadingContent}
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) return null;

  // Hero section - Fijo (no scrolleable)
  const heroSection = (
    <div className="flex-shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-primary/80" />
      <div className={cn(
        "relative z-10 flex flex-col items-center",
        isMobile ? "p-4 space-y-2" : "p-6 space-y-4"
      )}>
        {/* Avatar con botón de edición */}
        <div className="relative group">
          <Avatar className={cn(
            "ring-4 ring-white/20",
            isMobile ? "w-20 h-20" : "w-32 h-32 md:w-40 md:h-40"
          )}>
            <AvatarImage src={avatarPreview || user.avatar_url || undefined} />
            <AvatarFallback className={cn(
              "bg-white/20 text-white",
              isMobile ? "text-2xl" : "text-4xl"
            )}>
              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          {!avatarPreview && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 
                       rounded-full flex items-center justify-center transition-opacity"
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        
        {/* Botones de confirmación de avatar */}
        {avatarPreview && (
          <div className="flex gap-2">
            <Button 
              onClick={handleUploadAvatar} 
              disabled={uploadAvatar.isPending}
              size="sm"
              className="bg-white text-primary hover:bg-white/90"
            >
              {uploadAvatar.isPending ? 'Subiendo...' : 'Confirmar'}
            </Button>
            <Button 
              onClick={handleCancelAvatar}
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Info básica */}
        <div className="text-center space-y-2">
          <h2 className={cn(
            "font-bold text-white",
            isMobile ? "text-lg" : "text-2xl"
          )}>
            {user.full_name || user.email}
          </h2>
          <p className={cn(
            "text-white/90",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {user.email}
          </p>
          
          {/* Badges de roles translúcidos */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {user.roles.map((role) => (
              <Badge 
                key={role}
                className={cn(
                  "bg-white/20 text-white border-white/30 backdrop-blur-sm",
                  isMobile && "text-xs px-2 py-0.5"
                )}
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Fechas importantes */}
        <div className="flex flex-wrap gap-4 justify-center text-sm text-white/90">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Creado: {format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })}</span>
          </div>
          {user.fecha_nacimiento && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Cumpleaños: {format(new Date(user.fecha_nacimiento), 'dd MMM', { locale: es })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Contenido scrolleable
  const scrollableContent = (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="laboral">Laboral</TabsTrigger>
        <TabsTrigger value="documentos">Documentos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="personal" className="space-y-4 animate-in fade-in-50 duration-300">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <User className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full-name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nombre Completo
                </Label>
                <Input
                  id="full-name"
                  value={formData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Ej: 444-123-4567"
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha-nacimiento" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="fecha-nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rfc" className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-muted-foreground" />
                  RFC
                </Label>
                <Input
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => handleChange('rfc', e.target.value)}
                  placeholder="Ej: XAXX010101000"
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {!isClient && (
                <div className="space-y-2">
                  <Label htmlFor="imss" className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-muted-foreground" />
                    Número de IMSS
                  </Label>
                  <Input
                    id="imss"
                    value={formData.imss_number}
                    onChange={(e) => handleChange('imss_number', e.target.value)}
                    placeholder="Ej: 12345678901"
                    className="transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Contacto de Emergencia</CardTitle>
          </CardHeader>
          <CardContent>
            <EmergencyContactForm
              value={formData.emergency_contact}
              onChange={(value) => handleChange('emergency_contact', value)}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="laboral" className="space-y-4 animate-in fade-in-50 duration-300">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center gap-2 pb-3">
            <Briefcase className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Información Laboral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!isClient && (
                <div className="space-y-2">
                  <Label htmlFor="fecha-ingreso" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Fecha de Ingreso
                  </Label>
                  <Input
                    id="fecha-ingreso"
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                    className="transition-all focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="sucursal" className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  Sucursal
                </Label>
                <Select value={formData.sucursal_id} onValueChange={(value) => handleChange('sucursal_id', value)}>
                  <SelectTrigger id="sucursal" className="transition-all focus:ring-2 focus:ring-primary">
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
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Roles del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <UserRoleBadges
              userId={userId}
              currentRoles={user.roles as any}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="documentos" className="animate-in fade-in-50 duration-300 pb-6">
        <UserDocumentsTab userId={userId} />
      </TabsContent>
    </Tabs>
  );

  // Footer - Fijo (no scrolleable)
  const footerSection = (
    <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t bg-background">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
      </Button>
    </div>
  );
  
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] flex flex-col">
          {heroSection}
          
          <ScrollArea className="flex-1 h-0">
            <div className="px-6 pb-24">
              {scrollableContent}
            </div>
          </ScrollArea>
          
          {footerSection}
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        {heroSection}
        
        <ScrollArea className="flex-1 h-0">
          <div className="px-6 pb-6">
            {scrollableContent}
          </div>
        </ScrollArea>
        
        {footerSection}
      </DialogContent>
    </Dialog>
  );
}
