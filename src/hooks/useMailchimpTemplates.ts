import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MailchimpTemplate {
  id: string;
  name: string;
  type: string;
  thumbnail: string;
  category: string;
  date_created: string;
}

interface TemplateContent {
  html: string;
  sections: Record<string, any>;
}

export function useMailchimpTemplates() {
  // Obtener lista de templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['mailchimp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('mailchimp-templates', {
        body: { action: 'list' },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Error fetching templates');
      
      return data.templates as MailchimpTemplate[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Función para obtener contenido de un template específico
  const getTemplateContent = async (templateId: string): Promise<TemplateContent> => {
    const { data, error } = await supabase.functions.invoke('mailchimp-templates', {
      body: { action: 'get', templateId },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Error fetching template content');
    
    return data.content as TemplateContent;
  };

  return {
    templates: templates || [],
    isLoading,
    getTemplateContent,
  };
}
