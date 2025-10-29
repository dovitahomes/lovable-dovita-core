import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building } from "lucide-react";
import { BankDialog } from "@/components/forms/BankDialog";
import { BankAccountDialog } from "@/components/forms/BankAccountDialog";
import { LoadingError } from "@/components/common/LoadingError";
import { TableSkeleton } from "@/components/common/Skeletons";

export function BankAccountsTab() {
  const [banks, setBanks] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBankDialog, setShowBankDialog] = useState(false);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const { data: banksData, error: banksError } = await supabase
        .from("banks")
        .select("*")
        .order("nombre");
      
      if (banksError) throw banksError;

      const { data: accountsData, error: accountsError } = await supabase
        .from("bank_accounts")
        .select("*, banks(nombre)")
        .order("created_at", { ascending: false });
      
      if (accountsError) throw accountsError;
      
      setBanks(banksData || []);
      setAccounts(accountsData || []);
    } catch (err) {
      console.error("Error al cargar datos bancarios:", err);
      setError(true);
      toast.error("No pudimos cargar las cuentas bancarias");
    } finally {
      setLoading(false);
    }
  };

  const handleBankSuccess = () => {
    setShowBankDialog(false);
    setSelectedBank(null);
    loadData();
  };

  const handleAccountSuccess = () => {
    setShowAccountDialog(false);
    setSelectedAccount(null);
    loadData();
  };

  if (error) {
    return <LoadingError onRetry={loadData} />;
  }

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Bancos
          </CardTitle>
          <Button onClick={() => setShowBankDialog(true)} size="sm">
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
                    <Button variant="ghost" size="sm" onClick={() => {
                      setSelectedBank(bank);
                      setShowBankDialog(true);
                    }}>
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
          <Button onClick={() => setShowAccountDialog(true)} size="sm">
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
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowAccountDialog(true);
                      }}
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

      <BankDialog
        open={showBankDialog}
        onOpenChange={setShowBankDialog}
        bank={selectedBank}
        onSuccess={handleBankSuccess}
      />

      <BankAccountDialog
        open={showAccountDialog}
        onOpenChange={setShowAccountDialog}
        account={selectedAccount}
        banks={banks}
        onSuccess={handleAccountSuccess}
      />
    </div>
  );
}
