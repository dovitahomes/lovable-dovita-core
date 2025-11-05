import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProject } from '@/contexts/ProjectContext';

interface ProjectSelectorProps {
  variant?: 'mobile' | 'desktop';
}

export default function ProjectSelector({ variant = 'mobile' }: ProjectSelectorProps) {
  const { currentProject, availableProjects, setCurrentProject, hasMultipleProjects } = useProject();

  if (!currentProject) {
    return null;
  }

  if (!hasMultipleProjects) {
    // Show only project name if user has single project
    return (
      <div className="flex items-center gap-2">
        <span className={variant === 'mobile' ? 'text-base text-foreground' : 'text-white font-medium'}>
          {currentProject.name}
        </span>
      </div>
    );
  }

  // Show selector if user has multiple projects
  return (
    <Select value={currentProject.id} onValueChange={setCurrentProject}>
      <SelectTrigger 
        className={
          variant === 'mobile'
            ? 'h-auto border-none bg-transparent text-foreground hover:bg-transparent focus:ring-0 p-0 [&>svg]:hidden'
            : 'h-8 border-white/20 bg-white/10 text-white text-sm hover:bg-white/20 focus:ring-white/30 [&>svg]:text-white'
        }
      >
        {variant === 'mobile' ? (
          <SelectValue className="text-base" />
        ) : (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue />
          </div>
        )}
      </SelectTrigger>
      <SelectContent className="bg-background">
        {availableProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <span className="font-medium">{project.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
