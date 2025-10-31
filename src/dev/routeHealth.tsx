/**
 * Route Health Check (Dev Tool)
 * Validates that all sidebar items have corresponding routes
 * and all module names have proper permissions configured
 */

import { useEffect } from 'react';
import { SIDEBAR_SECTIONS, getAllSidebarItems, getAllModuleNames } from '@/config/sidebar';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export function RouteHealthCheck() {
  const { perms, loading } = useModuleAccess();
  
  useEffect(() => {
    if (import.meta.env.DEV && !loading) {
      validateRoutes();
    }
  }, [loading]);

  const validateRoutes = () => {
    console.group('🔍 Route Health Check');
    
    // Check all sidebar items
    const allItems = getAllSidebarItems();
    console.log('📋 Registered sidebar items:', allItems.length);
    
    allItems.forEach(item => {
      console.log(`  ✓ ${item.title} → ${item.url} (module: ${item.moduleName})`);
    });
    
    // Check module permissions
    const moduleNames = getAllModuleNames();
    console.log('\n🔐 Module permission check:');
    
    moduleNames.forEach(moduleName => {
      const hasPerm = perms?.find(p => p.module_name === moduleName);
      if (hasPerm) {
        console.log(`  ✓ ${moduleName} - configured`);
      } else {
        console.warn(`  ⚠ ${moduleName} - missing permissions in DB`);
      }
    });
    
    // Map UI fields to DB fields
    console.log('\n🗺️ Field mapping (UI → DB):');
    console.log('  purchase_orders:');
    console.log('    - qty_solicitada → qty requested');
    console.log('    - qty_ordenada → qty ordered');
    console.log('    - qty_recibida → qty received');
    console.log('    - estado → status (enum: solicitado, ordenado, recibido)');
    console.log('  gantt_plans:');
    console.log('    - type → gantt type (enum: parametrico, ejecutivo)');
    console.log('    - shared_with_construction → boolean flag');
    console.log('  tu_nodes:');
    console.log('    - type → node type (enum: departamento, mayor, partida, subpartida)');
    console.log('    - parent_id → hierarchical relationship');
    console.log('    - project_scope → scope (enum: global, departamento, proyecto)');
    
    console.groupEnd();
  };

  if (loading) {
    return <div>Loading health check...</div>;
  }

  const allItems = getAllSidebarItems();
  const moduleNames = getAllModuleNames();
  const missingPerms = moduleNames.filter(
    moduleName => !perms?.find(p => p.module_name === moduleName)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Route Health Check</h1>
        <p className="text-muted-foreground">
          Development tool to validate routing and permissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Registered Routes
            </CardTitle>
            <CardDescription>
              All sidebar items with their routes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {SIDEBAR_SECTIONS.map(section => (
                <div key={section.label} className="space-y-1">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    {section.label}
                  </h4>
                  {section.items.map(item => (
                    <div key={item.url} className="ml-4 text-sm flex items-center justify-between">
                      <span>{item.title}</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {item.url}
                      </code>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {missingPerms.length === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              Module Permissions
            </CardTitle>
            <CardDescription>
              Permission configuration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {moduleNames.map(moduleName => {
                const hasPerm = perms?.find(p => p.module_name === moduleName);
                return (
                  <div key={moduleName} className="flex items-center justify-between text-sm">
                    <span>{moduleName}</span>
                    {hasPerm ? (
                      <Badge variant="outline" className="bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50">
                        <XCircle className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Field Mapping (UI → DB)
          </CardTitle>
          <CardDescription>
            Reference for database field names
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">purchase_orders</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="text-muted-foreground">qty_solicitada</code>
                  <span>→ Cantidad solicitada</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-muted-foreground">qty_ordenada</code>
                  <span>→ Cantidad ordenada</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-muted-foreground">qty_recibida</code>
                  <span>→ Cantidad recibida</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-muted-foreground">estado</code>
                  <span>→ Estado (enum)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">gantt_plans</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="text-muted-foreground">type</code>
                  <span>→ Tipo (parametrico|ejecutivo)</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-muted-foreground">shared_with_construction</code>
                  <span>→ Compartido</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">tu_nodes</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <code className="text-muted-foreground">type</code>
                  <span>→ Tipo de nodo</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-muted-foreground">parent_id</code>
                  <span>→ Padre (jerárquico)</span>
                </div>
                <div className="flex justify-between">
                  <code className="text-muted-foreground">project_scope</code>
                  <span>→ Alcance</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {missingPerms.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Missing Permissions</AlertTitle>
          <AlertDescription>
            The following modules don't have permissions configured in the database:
            <div className="mt-2 flex flex-wrap gap-2">
              {missingPerms.map(mod => (
                <Badge key={mod} variant="outline">{mod}</Badge>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
