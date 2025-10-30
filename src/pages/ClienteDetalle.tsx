import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useClientById, useClientProjects, useUpsertClient } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Eye } from "lucide-react";
import { LoadingError } from "@/components/common/LoadingError";

export default function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    person_type: "fisica" as "fisica" | "moral",
    email: "",
    phone: ""
  });

  const { data: client, isLoading, error } = useClientById(id!);
  const { data: projects, isLoading: projectsLoading } = useClientProjects(id!);
  const upsertMutation = useUpsertClient();

  const handleEdit = () => {
    if (client) {
      setFormData({
        name: client.name,
        person_type: client.person_type,
        email: client.email || "",
        phone: client.phone || ""
      });
      setEditOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({
      id: id!,
      data: {
        name: formData.name,
        person_type: formData.person_type,
        email: formData.email || null,
        phone: formData.phone || null
      }
    }, {
      onSuccess: () => setEditOpen(false)
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <h1 className="text-3xl font-bold">Detalle del Cliente</h1>
        </div>
        <Button onClick={handleEdit}>
          <Pencil className="h-4 w-4 mr-2" /> Editar Cliente
        </Button>
      </div>

      <LoadingError
        isLoading={isLoading}
        error={error}
        isEmpty={!client}
        emptyMessage="Cliente no encontrado"
      />

      {client && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Nombre:</span>
                  <span className="ml-2">{client.name}</span>
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>
                  <Badge className="ml-2" variant={client.person_type === 'fisica' ? 'default' : 'secondary'}>
                    {client.person_type}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{client.email || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">Teléfono:</span>
                  <span className="ml-2">{client.phone || '-'}</span>
                </div>
                <div>
                  <span className="font-medium">Fecha de creación:</span>
                  <span className="ml-2">{new Date(client.created_at).toLocaleDateString('es-MX')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proyectos del Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <LoadingError
                isLoading={projectsLoading}
                error={null}
                isEmpty={!projects || projects.length === 0}
                emptyMessage="Este cliente aún no tiene proyectos"
              />
              {projects && projects.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Terreno (m²)</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.sucursales?.nombre || '-'}</TableCell>
                        <TableCell>
                          <Badge>{project.status}</Badge>
                        </TableCell>
                        <TableCell>{project.terreno_m2 ? `${project.terreno_m2} m²` : '-'}</TableCell>
                        <TableCell>{new Date(project.created_at).toLocaleDateString('es-MX')}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/proyectos/${project.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Tipo de persona *</Label>
              <Select
                value={formData.person_type}
                onValueChange={(value: any) => setFormData({ ...formData, person_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Física</SelectItem>
                  <SelectItem value="moral">Moral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
