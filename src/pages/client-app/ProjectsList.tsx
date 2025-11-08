import { useClientProjects } from '@/hooks/client-app/useClientProjects';
import { useAuthSession } from '@/hooks/useAuthSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProjectsList() {
  const { user } = useAuthSession();
  
  // TODO: Obtener client_id del perfil del usuario
  // Por ahora usamos null hasta que se implemente la relación user -> client
  const clientId = null;
  
  const { data: projects, isLoading } = useClientProjects(clientId);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Mis Proyectos</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mis Proyectos</h1>
      
      <div className="grid gap-4">
        {projects?.map((project) => (
          <Link key={project.project_id} to={`/cliente/proyectos/${project.project_id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{project.project_name}</CardTitle>
                  <Badge variant={project.status === 'activo' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Código: {project.project_code}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Creado: {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        
        {projects?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No tienes proyectos asignados
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
