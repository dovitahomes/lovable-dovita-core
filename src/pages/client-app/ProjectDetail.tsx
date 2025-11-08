import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientProjectSummary } from '@/hooks/client-app/useClientProjectSummary';
import ProjectSummaryTab from '@/components/client-app/ProjectSummaryTab';
import ProjectBudgetTab from '@/components/client-app/ProjectBudgetTab';
import ProjectProgressTab from '@/components/client-app/ProjectProgressTab';
import ProjectAppointmentsTab from '@/components/client-app/ProjectAppointmentsTab';
import ProjectDocumentsTab from '@/components/client-app/ProjectDocumentsTab';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: summary, isLoading } = useClientProjectSummary(id || null);
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-1/3 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{summary?.project_name || 'Proyecto'}</h1>
      
      <Tabs defaultValue="resumen" className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>
          <TabsTrigger value="avance">Avance</TabsTrigger>
          <TabsTrigger value="citas">Citas</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resumen" className="mt-6">
          <ProjectSummaryTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="presupuesto" className="mt-6">
          <ProjectBudgetTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="avance" className="mt-6">
          <ProjectProgressTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="citas" className="mt-6">
          <ProjectAppointmentsTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="documentos" className="mt-6">
          <ProjectDocumentsTab projectId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
