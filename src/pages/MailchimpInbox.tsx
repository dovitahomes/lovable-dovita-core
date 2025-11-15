import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMailchimpEmails, type MailchimpEmail } from "@/hooks/useMailchimpEmails";
import { Mail, Star, Archive, ExternalLink, Search, Inbox, StarIcon, ArchiveIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEmailConfig } from "@/hooks/useEmailConfig";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MailchimpInbox() {
  const [selectedEmail, setSelectedEmail] = useState<MailchimpEmail | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "starred">("all");
  
  const { config } = useEmailConfig();
  
  const filters = {
    search,
    ...(activeTab === "unread" && { read: false, archived: false }),
    ...(activeTab === "starred" && { starred: true, archived: false }),
    ...(activeTab === "all" && { archived: false }),
  };

  const { 
    emails, 
    isLoading, 
    unreadCount, 
    starredCount,
    toggleRead, 
    toggleStarred, 
    toggleArchived 
  } = useMailchimpEmails(filters);

  const handleEmailClick = (email: MailchimpEmail) => {
    setSelectedEmail(email);
    if (!email.read) {
      toggleRead({ id: email.id, read: true });
    }
  };

  const handleOpenInMailchimp = () => {
    if (config && config.mailchimp_server_prefix && selectedEmail) {
      const mailchimpUrl = `https://${config.mailchimp_server_prefix}.admin.mailchimp.com/`;
      window.open(mailchimpUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bandeja de Entrada</h1>
          <p className="text-muted-foreground">
            Emails recibidos via Mailchimp
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Inbox className="h-4 w-4" />
            Todos
            {emails.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {emails.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <Mail className="h-4 w-4" />
            No leídos
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="starred" className="gap-2">
            <StarIcon className="h-4 w-4" />
            Destacados
            {starredCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {starredCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {emails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "unread" && "No hay emails no leídos"}
                  {activeTab === "starred" && "No hay emails destacados"}
                  {activeTab === "all" && "No hay emails en la bandeja"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <Card 
                  key={email.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${!email.read ? 'border-l-4 border-l-primary' : ''}`}
                  onClick={() => handleEmailClick(email)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className={`text-base truncate ${!email.read ? 'font-bold' : 'font-normal'}`}>
                            {email.from_name || email.from_email}
                          </CardTitle>
                          {email.starred && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <CardDescription className="text-sm truncate">
                          {email.subject}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(email.received_at), "PPp", { locale: es })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarred({ id: email.id, starred: !email.starred });
                          }}
                        >
                          <Star className={`h-4 w-4 ${email.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleArchived({ id: email.id, archived: true });
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para mostrar email completo */}
      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedEmail?.subject}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInMailchimp}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en Mailchimp
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{selectedEmail.from_name || selectedEmail.from_email}</p>
                  <p className="text-muted-foreground">{selectedEmail.from_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">
                    {format(new Date(selectedEmail.received_at), "PPPp", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <ScrollArea className="h-[400px]">
                  {selectedEmail.body_html ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                      className="prose dark:prose-invert max-w-none"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {selectedEmail.body_text || 'Sin contenido'}
                    </pre>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
