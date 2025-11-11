import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/crm/useContacts";
import { useAccounts } from "@/hooks/crm/useAccounts";
import { AttachmentsTab } from "@/components/crm/AttachmentsTab";
import { Plus, Search, User, Mail, Phone, Trash2, Building2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    job_title: "",
    account_id: "",
    notes: ""
  });

  const { data: contacts = [], isLoading } = useContacts(search, selectedAccountId || undefined);
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData as any);
    setFormOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedContact) return;
    await updateMutation.mutateAsync({ id: selectedContact.id, data: formData as any });
    setFormOpen(false);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contacto?")) return;
    await deleteMutation.mutateAsync(id);
    setDetailOpen(false);
  };

  const openEditForm = (contact: any) => {
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      job_title: contact.job_title || "",
      account_id: contact.account_id || "",
      notes: contact.notes || ""
    });
    setDetailOpen(false);
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      mobile: "",
      job_title: "",
      account_id: "",
      notes: ""
    });
    setSelectedContact(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contactos</h1>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nuevo Contacto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedContact ? "Editar" : "Nuevo"} Contacto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nombre *</Label><Input value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} /></div>
                <div><Label>Apellido *</Label><Input value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} /></div>
                <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                <div><Label>Teléfono</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                <div><Label>Móvil</Label><Input value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} /></div>
                <div><Label>Puesto</Label><Input value={formData.job_title} onChange={(e) => setFormData({...formData, job_title: e.target.value})} /></div>
                <div className="col-span-2">
                  <Label>Cuenta Asociada</Label>
                  <Select value={formData.account_id || "none"} onValueChange={(v) => setFormData({...formData, account_id: v === "none" ? "" : v})}>
                    <SelectTrigger><SelectValue placeholder="Sin cuenta" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cuenta</SelectItem>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Notas</Label><Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={selectedContact ? handleUpdate : handleCreate}>{selectedContact ? "Actualizar" : "Crear"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar contactos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedAccountId || "all"} onValueChange={(v) => setSelectedAccountId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas las cuentas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedContact(contact); setDetailOpen(true); }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{contact.first_name[0]}{contact.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{contact.first_name} {contact.last_name}</CardTitle>
                    {contact.job_title && <p className="text-sm text-muted-foreground truncate">{contact.job_title}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {contact.email && (<div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4 flex-shrink-0" /><span className="truncate">{contact.email}</span></div>)}
                {contact.phone && (<div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 flex-shrink-0" /><span>{contact.phone}</span></div>)}
                {/* No mostrar cuenta en la tarjeta, se mostrará en el detalle */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedContact && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedContact.first_name} {selectedContact.last_name}</DialogTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditForm(selectedContact)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(selectedContact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </DialogHeader>
            <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="attachments">Adjuntos</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="flex-1 overflow-auto space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Puesto</Label><p>{selectedContact.job_title || '-'}</p></div>
                  <div><Label>Cuenta</Label><p>{accounts.find(a => a.id === selectedContact.account_id)?.name || '-'}</p></div>
                  <div><Label>Email</Label><p>{selectedContact.email || '-'}</p></div>
                  <div><Label>Teléfono</Label><p>{selectedContact.phone || '-'}</p></div>
                  <div><Label>Móvil</Label><p>{selectedContact.mobile || '-'}</p></div>
                  {selectedContact.notes && (<div className="col-span-2"><Label>Notas</Label><p className="whitespace-pre-wrap">{selectedContact.notes}</p></div>)}
                </div>
              </TabsContent>
              <TabsContent value="attachments" className="flex-1 overflow-auto p-4">
                <AttachmentsTab entityType="contact" entityId={selectedContact.id} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
