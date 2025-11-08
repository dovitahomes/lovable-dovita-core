import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from "@/hooks/crm/useAccounts";
import { AttachmentsTab } from "@/components/crm/AttachmentsTab";
import { Plus, Search, Building2, Mail, Phone, Globe, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ACCOUNT_TYPES = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'proveedor', label: 'Proveedor' },
  { value: 'socio', label: 'Socio' }
];

export default function Accounts() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    account_type: "prospecto",
    email: "",
    phone: "",
    website: "",
    industry: "",
    notes: ""
  });

  const { data: accounts = [], isLoading } = useAccounts(search, selectedType || undefined);
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData as any);
    setFormOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedAccount) return;
    await updateMutation.mutateAsync({ id: selectedAccount.id, data: formData as any });
    setFormOpen(false);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta cuenta?")) return;
    await deleteMutation.mutateAsync(id);
    setDetailOpen(false);
  };

  const openEditForm = (account: any) => {
    setFormData({
      name: account.name,
      account_type: account.account_type,
      email: account.email || "",
      phone: account.phone || "",
      website: account.website || "",
      industry: account.industry || "",
      notes: account.notes || ""
    });
    setDetailOpen(false);
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      account_type: "prospecto",
      email: "",
      phone: "",
      website: "",
      industry: "",
      notes: ""
    });
    setSelectedAccount(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cuentas</h1>
        <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedAccount ? "Editar" : "Nueva"} Cuenta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={formData.account_type} onValueChange={(v) => setFormData({...formData, account_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <Label>Sitio Web</Label>
                  <Input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                </div>
                <div>
                  <Label>Industria</Label>
                  <Input value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={selectedAccount ? handleUpdate : handleCreate}>
                {selectedAccount ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cuentas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedAccount(account); setDetailOpen(true); }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Building2 className="h-8 w-8 text-primary" />
                  <Badge>{ACCOUNT_TYPES.find(t => t.value === account.account_type)?.label}</Badge>
                </div>
                <CardTitle className="text-lg">{account.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {account.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{account.email}</span>
                  </div>
                )}
                {account.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{account.phone}</span>
                  </div>
                )}
                {account.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="truncate">{account.website}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      {selectedAccount && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedAccount.name}</DialogTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditForm(selectedAccount)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(selectedAccount.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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
                  <div><Label>Tipo</Label><p>{ACCOUNT_TYPES.find(t => t.value === selectedAccount.account_type)?.label}</p></div>
                  <div><Label>Industria</Label><p>{selectedAccount.industry || '-'}</p></div>
                  <div><Label>Email</Label><p>{selectedAccount.email || '-'}</p></div>
                  <div><Label>Teléfono</Label><p>{selectedAccount.phone || '-'}</p></div>
                  <div className="col-span-2"><Label>Sitio Web</Label><p>{selectedAccount.website || '-'}</p></div>
                  {selectedAccount.notes && (<div className="col-span-2"><Label>Notas</Label><p className="whitespace-pre-wrap">{selectedAccount.notes}</p></div>)}
                </div>
              </TabsContent>
              <TabsContent value="attachments" className="flex-1 overflow-auto p-4">
                <AttachmentsTab entityType="account" entityId={selectedAccount.id} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
