import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/auth/AuthProvider';
import {
  isWebAuthnSupported,
  registerBiometric,
  hasBiometricEnabled,
  disableBiometric,
} from '@/lib/webauthn';
import { toast } from 'sonner';

export function useBiometricAuth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isSupported = isWebAuthnSupported();

  // Query to check if biometric is enabled
  const { data: isEnabled, isLoading: isCheckingStatus } = useQuery({
    queryKey: ['biometric-enabled', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      return await hasBiometricEnabled(user.id);
    },
    enabled: !!user?.id && isSupported,
  });

  // Mutation to register biometric
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario no autenticado');
      return await registerBiometric(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-enabled', user?.id] });
      toast.success('Biométricos activados exitosamente', {
        description: 'Ahora puedes usar tu huella dactilar o reconocimiento facial para iniciar sesión.',
      });
    },
    onError: (error: any) => {
      console.error('Error registering biometric:', error);
      toast.error('Error al activar biométricos', {
        description: error.message || 'No se pudo registrar la autenticación biométrica.',
      });
    },
  });

  // Mutation to disable biometric
  const disableMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuario no autenticado');
      return await disableBiometric(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-enabled', user?.id] });
      toast.success('Biométricos desactivados', {
        description: 'Ya no podrás usar autenticación biométrica para iniciar sesión.',
      });
    },
    onError: (error: any) => {
      console.error('Error disabling biometric:', error);
      toast.error('Error al desactivar biométricos', {
        description: error.message || 'No se pudo eliminar la autenticación biométrica.',
      });
    },
  });

  return {
    isSupported,
    isEnabled: isEnabled || false,
    isLoading: isCheckingStatus || registerMutation.isPending || disableMutation.isPending,
    register: registerMutation.mutate,
    disable: disableMutation.mutate,
  };
}
