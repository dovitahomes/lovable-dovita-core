import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/app/auth/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function UserAvatar() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const initials = profile?.full_name ? getInitials(profile.full_name) : 'U';
  
  // Get avatar URL if exists
  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : undefined;

  return (
    <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
      <AvatarImage src={avatarUrl} alt={profile?.full_name || 'User'} />
      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-orange-500 text-white font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
