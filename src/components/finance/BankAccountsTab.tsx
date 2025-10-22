import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building } from "lucide-react";

export function BankAccountsTab() {
  const [banks, setBanks] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [bankForm, setBankForm] = useState({ nombre: "", codigo: "" });
  const [accountForm, setAccountForm] = useState<{
    bank_id: string;
    numero_cuenta: string;
    tipo_cuenta: string;
    moneda: "MXN" | "USD" | "EUR";
    saldo_actual: number;
  }>({
    bank_id: "",
    numero_cuenta: "",
    tipo_cuenta: "",
    moneda: "MXN",
    saldo_actual: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: banksData } = await supabase
      .from("banks")
      .select("*")
      .order("nombre");
    setBanks(banksData || []);

    const { data: accountsData } = await supabase
      .from("bank_accounts")
      .select("*, banks(nombre)")
      .order("created_at", { ascending: false });
    setAccounts(accountsData || []);
  };

  const handleSaveBank = async () => {
    if (selectedBank) {
      const { error } = await supabase
        .from("banks")
        .update(bankForm)
        .eq("id", selectedBank.id);
      if (error) {
        toast.error("Error al actualizar");
        return;
      }
    } else {
      const { error } = await supabase.from("banks").insert([bankForm]);
      if (error) {
        toast.error("Error al crear");
        return;
      }
    }
    toast.success("Banco guardado");
    setShowBankDialog(false);
    setBankForm({ nombre: "", codigo: "" });
    setSelectedBank(null);
    loadData();
  };

  const handleSaveAccount = async () => {
    if (selectedAccount) {
      const { error } = await supabase
        .from("bank_accounts")
        .update(accountForm)
        .eq("id", selectedAccount.id);
      if (error) {
        toast.error("Error al actualizar");
        return;
      }
    } else {
      const { error } = await supabase.from("bank_accounts").insert([accountForm]);
      if (error) {
        toast.error("Error al crear");
        return;
      }
    }
    toast.success("Cuenta guardada");
    setShowAccountDialog(false);
    setAccountForm({
      bank_id: "",
      numero_cuenta: "",
      tipo_cuenta: "",
      moneda: "MXN",
      saldo_actual: 0,
    });
    setSelectedAccount(null);
    loadData();
  };

  const openBankDialog = (bank?: any) => {
    if (bank) {
      setSelectedBank(bank);
      setBankForm({ nombre: bank.nombre, codigo: bank.codigo || "" });
    } else {
      setSelectedBank(null);
      setBankForm({ nombre: "", codigo: "" });
    }
    setShowBankDialog(true);
  };

  const openAccountDialog = (account?: any) => {
    if (account) {
      setSelectedAccount(account);
      setAccountForm({
        bank_id: account.bank_id,
        numero_cuenta: account.numero_cuenta,
        tipo_cuenta: account.tipo_cuenta || "",
        moneda: account.moneda,
        saldo_actual: account.saldo_actual || 0,
      });
    } else {
      setSelectedAccount(null);
      setAccountForm({
        bank_id: "",
        numero_cuenta: "",
        tipo_cuenta: "",
        moneda: "MXN",
        saldo_actual: 0,
      });
    }
    setShowAccountDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bancos
          </CardTitle>
          <Button onClick={() => openBankDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Banco
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <Card key={bank.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{bank.nombre}</p>
                      {bank.codigo && (
                        <p className="text-sm text-muted-foreground">{bank.codigo}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openBankDialog(bank)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuentas Bancarias</CardTitle>
          <Button onClick={() => openAccountDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banco</TableHead>
                <TableHead>Número de Cuenta</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.banks?.nombre}</TableCell>
                  <TableCell className="font-mono">{account.numero_cuenta}</TableCell>
                  <TableCell>{account.tipo_cuenta}</TableCell>
                  <TableCell>{account.moneda}</TableCell>
                  <TableCell className="text-right font-semibold">
                    ${account.saldo_actual?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.activa ? "default" : "secondary"}>
                      {account.activa ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAccountDialog(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBank ? "Editar" : "Nuevo"} Banco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre del Banco</Label>
              <Input
                value={bankForm.nombre}
                onChange={(e) => setBankForm({ ...bankForm, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label>Código</Label>
              <Input
                value={bankForm.codigo}
                onChange={(e) => setBankForm({ ...bankForm, codigo: e.target.value })}
              />
            </div>
            <Button onClick={handleSaveBank} className="w-full">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAccount ? "Editar" : "Nueva"} Cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Banco</Label>
              <Select
                value={accountForm.bank_id}
                onValueChange={(v) => setAccountForm({ ...accountForm, bank_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar banco" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número de Cuenta</Label>
              <Input
                value={accountForm.numero_cuenta}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, numero_cuenta: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Tipo de Cuenta</Label>
              <Input
                value={accountForm.tipo_cuenta}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, tipo_cuenta: e.target.value })
                }
                placeholder="Ej: Cuenta de cheques"
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select
                value={accountForm.moneda}
                onValueChange={(v: "MXN" | "USD" | "EUR") => setAccountForm({ ...accountForm, moneda: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Saldo Inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={accountForm.saldo_actual}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    saldo_actual: parseFloat(e.target.value),
                  })
                }
              />
            </div>
            <Button onClick={handleSaveAccount} className="w-full">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
