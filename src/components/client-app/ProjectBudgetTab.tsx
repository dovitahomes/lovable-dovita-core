import { useClientBudgetCategories } from '@/hooks/client-app/useClientBudgetCategories';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ProjectBudgetTabProps {
  projectId: string;
}

export default function ProjectBudgetTab({ projectId }: ProjectBudgetTabProps) {
  const { data: categories, isLoading } = useClientBudgetCategories(projectId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-8 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!categories || categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No hay información de presupuesto disponible
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const percentage = category.budgeted 
          ? Math.round((category.spent / category.budgeted) * 100)
          : 0;
        
        return (
          <Card key={category.mayor_id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Presupuestado</span>
                  <span className="font-medium">
                    ${(category.budgeted || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastado</span>
                  <span className="font-medium">
                    ${(category.spent || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="text-xs text-right text-muted-foreground">
                  {percentage}% ejecutado
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
