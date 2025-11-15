import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, ImageIcon, Sparkles, FileText, Image } from "lucide-react";
import CorporateInfoForm from "@/components/admin/CorporateInfoForm";
import RendersManagement from "@/components/admin/RendersManagement";
import PromotionsManagement from "@/components/admin/PromotionsManagement";
import ManualsManagement from "@/components/admin/ManualsManagement";
import ImagenAuthManagement from "@/components/admin/ImagenAuthManagement";

export default function ContenidoCorporativo() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Contenido Corporativo</h1>
        <p className="text-muted-foreground">
          Gestiona toda la información corporativa que se muestra en el Dashboard
        </p>
      </div>

      <Tabs defaultValue="info-empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="info-empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Información Empresa</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="renders" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Renders del Mes</span>
            <span className="sm:hidden">Renders</span>
          </TabsTrigger>
          <TabsTrigger value="promociones" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Promociones</span>
            <span className="sm:hidden">Promos</span>
          </TabsTrigger>
          <TabsTrigger value="manuales" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Manuales</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="imagen-auth" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Imagen Auth</span>
            <span className="sm:hidden">Auth</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info-empresa" className="mt-6">
          <CorporateInfoForm />
        </TabsContent>

        <TabsContent value="renders" className="mt-6">
          <RendersManagement />
        </TabsContent>

        <TabsContent value="promociones" className="mt-6">
          <PromotionsManagement />
        </TabsContent>

        <TabsContent value="manuales" className="mt-6">
          <ManualsManagement />
        </TabsContent>

        <TabsContent value="imagen-auth" className="mt-6">
          <ImagenAuthManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
