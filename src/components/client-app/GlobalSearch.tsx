import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { mockAppointments, mockChatMessages } from '@/lib/client-data';
import { Search, Calendar, FileText, MessageSquare, Users, Image, Clock, X } from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { currentProject } = useProject();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleClear = () => {
    setQuery('');
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    setQuery('');
    navigate(path);
  };

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim() || !currentProject) return null;

    const searchTerm = query.toLowerCase().trim();
    
    // Search appointments
    const appointments = mockAppointments
      .filter(apt => apt.projectId === currentProject.id)
      .filter(apt => 
        apt.type.toLowerCase().includes(searchTerm) ||
        apt.location.toLowerCase().includes(searchTerm) ||
        apt.notes.toLowerCase().includes(searchTerm) ||
        apt.teamMember.name.toLowerCase().includes(searchTerm)
      )
      .slice(0, 5);

    // Search documents
    const documents = currentProject.documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm) ||
      doc.category.toLowerCase().includes(searchTerm)
    ).slice(0, 5);

    // Search chat messages
    const messages = mockChatMessages
      .filter(msg => msg.projectId === currentProject.id)
      .filter(msg => msg.content.toLowerCase().includes(searchTerm))
      .slice(0, 5);

    // Search team members
    const team = currentProject.team.filter(member =>
      member.name.toLowerCase().includes(searchTerm) ||
      member.role.toLowerCase().includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm)
    ).slice(0, 5);

    // Search phases/schedule
    const phases = currentProject.phases.filter(phase =>
      phase.name.toLowerCase().includes(searchTerm)
    ).slice(0, 5);

    const hasResults = appointments.length > 0 || documents.length > 0 || 
                       messages.length > 0 || team.length > 0 || phases.length > 0;

    return hasResults ? { appointments, documents, messages, team, phases } : null;
  }, [query, currentProject]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0" aria-describedby="search-description">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle>Búsqueda Global</DialogTitle>
          <p id="search-description" className="sr-only">
            Busca en todo tu proyecto: citas, documentos, mensajes, equipo y cronograma
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar en citas, documentos, chat, equipo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 border-0 focus-visible:ring-0 text-base focus-ring"
              autoFocus
              aria-label="Campo de búsqueda global"
              role="searchbox"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 focus-ring"
                onClick={handleClear}
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4" role="region" aria-live="polite" aria-label="Resultados de búsqueda">
            {!query.trim() && (
              <div className="text-center py-12 text-muted-foreground" role="status">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-40" aria-hidden="true" />
                <p className="text-sm">Busca en todo tu proyecto</p>
                <p className="text-xs mt-1">Citas, documentos, mensajes, equipo y más</p>
              </div>
            )}

            {query.trim() && !searchResults && (
              <div className="text-center py-12 text-muted-foreground" role="status">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-40" aria-hidden="true" />
                <p className="text-sm">No se encontraron resultados</p>
                <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
              </div>
            )}

            {searchResults && (
              <div className="space-y-6">
                {/* Appointments */}
                {searchResults.appointments.length > 0 && (
                  <section aria-labelledby="search-appointments">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 id="search-appointments" className="font-semibold text-sm">Citas</h3>
                      <Badge variant="secondary" aria-label={`${searchResults.appointments.length} resultados`}>
                        {searchResults.appointments.length}
                      </Badge>
                    </div>
                    <div className="space-y-2" role="list">
                      {searchResults.appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors focus-ring"
                          onClick={() => handleNavigate('/client/appointments')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNavigate('/client/appointments');
                            }
                          }}
                          role="listitem button"
                          tabIndex={0}
                          aria-label={`Cita: ${apt.type}, ${format(new Date(apt.date), "d MMM, yyyy", { locale: es })} a las ${apt.time}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{apt.type}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(apt.date), "d MMM, yyyy", { locale: es })} - {apt.time}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Documents */}
                {searchResults.documents.length > 0 && (
                  <section aria-labelledby="search-documents">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 id="search-documents" className="font-semibold text-sm">Documentos</h3>
                      <Badge variant="secondary" aria-label={`${searchResults.documents.length} resultados`}>
                        {searchResults.documents.length}
                      </Badge>
                    </div>
                    <div className="space-y-2" role="list">
                      {searchResults.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors focus-ring"
                          onClick={() => handleNavigate('/client/documents')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNavigate('/client/documents');
                            }
                          }}
                          role="listitem button"
                          tabIndex={0}
                          aria-label={`Documento: ${doc.name}, ${doc.category}, ${doc.size}`}
                        >
                          <div className="flex items-center gap-3">
                            {doc.type === 'pdf' ? (
                              <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            ) : (
                              <Image className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.size} • {doc.date}</p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">
                              {doc.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Messages */}
                {searchResults.messages.length > 0 && (
                  <section aria-labelledby="search-messages">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 id="search-messages" className="font-semibold text-sm">Mensajes</h3>
                      <Badge variant="secondary" aria-label={`${searchResults.messages.length} resultados`}>
                        {searchResults.messages.length}
                      </Badge>
                    </div>
                    <div className="space-y-2" role="list">
                      {searchResults.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors focus-ring"
                          onClick={() => handleNavigate('/client/chat')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNavigate('/client/chat');
                            }
                          }}
                          role="listitem button"
                          tabIndex={0}
                          aria-label={`Mensaje: ${msg.content.substring(0, 50)}...`}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm line-clamp-2">{msg.content}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {!msg.isClient && msg.sender && (
                                  <>
                                    <span>{msg.sender.name}</span>
                                    <span aria-hidden="true">•</span>
                                  </>
                                )}
                                <time>{format(new Date(msg.timestamp), "d MMM, HH:mm", { locale: es })}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Team */}
                {searchResults.team.length > 0 && (
                  <section aria-labelledby="search-team">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 id="search-team" className="font-semibold text-sm">Equipo</h3>
                      <Badge variant="secondary" aria-label={`${searchResults.team.length} resultados`}>
                        {searchResults.team.length}
                      </Badge>
                    </div>
                    <div className="space-y-2" role="list">
                      {searchResults.team.map((member) => (
                        <div
                          key={member.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors focus-ring"
                          onClick={() => handleNavigate('/client/chat')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNavigate('/client/chat');
                            }
                          }}
                          role="listitem button"
                          tabIndex={0}
                          aria-label={`Miembro del equipo: ${member.name}, ${member.role}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
                              <span className="text-xs font-medium text-primary">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Phases/Schedule */}
                {searchResults.phases.length > 0 && (
                  <section aria-labelledby="search-schedule">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h3 id="search-schedule" className="font-semibold text-sm">Cronograma</h3>
                      <Badge variant="secondary" aria-label={`${searchResults.phases.length} resultados`}>
                        {searchResults.phases.length}
                      </Badge>
                    </div>
                    <div className="space-y-2" role="list">
                      {searchResults.phases.map((phase) => {
                        const statusLabel = phase.status === 'completed' ? 'Completado' : 
                                          phase.status === 'in-progress' ? 'En Proceso' : 
                                          'Pendiente';
                        return (
                          <div
                            key={phase.id}
                            className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors focus-ring"
                            onClick={() => handleNavigate('/client/schedule')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNavigate('/client/schedule');
                              }
                            }}
                            role="listitem button"
                            tabIndex={0}
                            aria-label={`Fase: ${phase.name}, ${statusLabel}, desde ${phase.startDate} hasta ${phase.endDate}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{phase.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {phase.startDate} - {phase.endDate}
                                </p>
                              </div>
                              <Badge 
                                variant={
                                  phase.status === 'completed' ? 'default' : 
                                  phase.status === 'in-progress' ? 'secondary' : 
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {statusLabel}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
