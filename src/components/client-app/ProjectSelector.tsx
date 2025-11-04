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

  if (!hasMultipleProjects || !currentProject) {
    // Show only project name if user has single project
    return (
      <div className={variant === 'mobile' ? 'flex items-center gap-2' : 'flex items-center gap-2'}>
        {variant === 'mobile' && <Building2 className="h-5 w-5 text-white" />}
        <span className={variant === 'mobile' ? 'text-white font-medium text-sm' : 'text-white font-medium'}>
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
            ? 'h-9 border-white/20 bg-white/10 text-white hover:bg-white/20 focus:ring-white/30 [&>svg]:text-white'
            : 'h-8 border-white/20 bg-white/10 text-white text-sm hover:bg-white/20 focus:ring-white/30 [&>svg]:text-white'
        }
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue />
        </div>
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
