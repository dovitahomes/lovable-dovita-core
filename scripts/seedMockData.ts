/* eslint-disable no-console */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const MOCK_TAG = 'MOCK_DOVITA';
const MOCK_BATCH = 'MOCK_DOVITA_BATCH_001';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supa = createClient(url, serviceKey, { auth: { persistSession: false } });

type UUID = string;

function rand<T>(arr: T[]): T { 
  return arr[Math.floor(Math.random() * arr.length)]; 
}

function rint(min: number, max: number): number { 
  return Math.floor(Math.random() * (max - min + 1)) + min; 
}

const today = new Date();

const sucursales = ['León', 'Guanajuato', 'Querétaro', 'CDMX', 'GDL'];
const mayoresEj = [
  { code: '01', name: 'Preliminares' },
  { code: '02', name: 'Cimentación' },
  { code: '03', name: 'Estructura' },
  { code: '04', name: 'Albañilería' },
  { code: '05', name: 'Instalaciones' },
  { code: '06', name: 'Acabados' }
];

async function getSucursalId(nombre: string): Promise<UUID | null> {
  const { data } = await supa
    .from('sucursales')
    .select('id')
    .ilike('nombre', `%${nombre}%`)
    .limit(1)
    .single();
  return data?.id || null;
}

async function upsertProvider(name: string): Promise<UUID | undefined> {
  const code = name.toLowerCase().replace(/\s+/g, '_').slice(0, 10);
  const { data, error } = await supa
    .from('providers')
    .insert({ 
      name: `${name} [${MOCK_TAG}]`, 
      code_short: code,
      activo: true
    })
    .select('id')
    .single();
  
  if (error && !String(error.message).includes('duplicate')) {
    console.warn('⚠️  Provider insert warning:', error.message);
  }
  
  if (data?.id) return data.id as UUID;
  
  const { data: existing } = await supa
    .from('providers')
    .select('id')
    .ilike('name', `${name} [%`)
    .limit(1)
    .single();
  return existing?.id;
}

async function upsertBank(name: string): Promise<UUID | undefined> {
  const { data, error } = await supa
    .from('banks')
    .insert({
      nombre: `${name} [${MOCK_TAG}]`,
      codigo: name.slice(0, 4).toUpperCase(),
      activo: true
    })
    .select('id')
    .single();
  
  if (error && !String(error.message).includes('duplicate')) {
    console.warn('⚠️  Bank insert warning:', error.message);
  }
  
  if (data?.id) return data.id as UUID;
  
  const { data: existing } = await supa
    .from('banks')
    .select('id')
    .ilike('nombre', `${name} [%`)
    .limit(1)
    .single();
  return existing?.id;
}

async function ensureBankAccount(bank_id: UUID): Promise<UUID> {
  const numero = `00${rint(1000000, 9999999)}`;
  const { data, error } = await supa
    .from('bank_accounts')
    .insert({
      bank_id,
      numero_cuenta: numero,
      tipo_cuenta: 'cheques',
      moneda: 'MXN',
      activa: true,
      saldo_actual: 0
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data!.id as UUID;
}

async function createLeadAndClient(idx: number): Promise<UUID> {
  const fullName = `Cliente Mock ${idx} ${MOCK_TAG}`;
  const email = `cliente${idx}@mock.dovita.test`;
  const telefono = `477${rint(1000000, 9999999)}`;
  const sucursalNombre = rand(sucursales);
  const sucursal_id = await getSucursalId(sucursalNombre);

  // Create lead
  await supa.from('leads').insert({
    nombre_completo: fullName,
    email,
    telefono,
    origen_lead: [rand(['redes_sociales', 'recomendacion', 'alianza', 'publicidad'])],
    notas: `${MOCK_TAG} ${MOCK_BATCH}`,
    sucursal_id,
    terreno_m2: rint(160, 320),
    presupuesto_referencia: rint(1500000, 4000000),
    status: 'convertido'
  });

  // Create client
  const { data: client, error: cErr } = await supa
    .from('clients')
    .insert({
      name: fullName,
      email,
      phone: telefono,
      person_type: rand(['fisica', 'moral']),
      address_json: {
        calle: `Calle Mock ${idx}`,
        ciudad: sucursalNombre,
        estado: 'Guanajuato',
        cp: `37${rint(100, 999)}`
      }
    })
    .select('id')
    .single();
  
  if (cErr) throw cErr;
  return client!.id as UUID;
}

async function createProject(client_id: UUID, idx: number): Promise<UUID> {
  const sucursalNombre = rand(sucursales);
  const sucursal_id = await getSucursalId(sucursalNombre);

  const { data, error } = await supa
    .from('projects')
    .insert({
      client_id,
      sucursal_id,
      status: 'activo',
      ubicacion_json: {
        ciudad: sucursalNombre,
        estado: 'Guanajuato',
        referencia: `Proyecto Mock ${idx}`
      },
      terreno_m2: rint(160, 320),
      notas: `${MOCK_TAG} ${MOCK_BATCH} - Proyecto de prueba ${idx}`
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data!.id as UUID;
}

async function createBudgetParametrico(project_id: UUID): Promise<UUID> {
  const { data: budget, error } = await supa
    .from('budgets')
    .insert({
      project_id,
      type: 'parametrico',
      status: 'publicado',
      cliente_view_enabled: true,
      iva_enabled: true,
      notas: `${MOCK_TAG} ${MOCK_BATCH}`
    })
    .select('id')
    .single();
  
  if (error) throw error;
  const budget_id = budget!.id as UUID;

  // Insert budget items grouped by mayor
  for (let j = 0; j < mayoresEj.length; j++) {
    const mj = mayoresEj[j];
    for (let i = 0; i < 3; i++) {
      const costo = rint(5000, 35000);
      const cantidad = rint(2, 8);
      const precioUnit = Math.round(costo * 1.15);
      
      await supa.from('budget_items').insert({
        budget_id,
        descripcion: `${mj.name} - Item ${i + 1} [${MOCK_TAG}]`,
        unidad: rand(['pza', 'm2', 'm', 'lote']),
        cant_necesaria: cantidad,
        cant_real: cantidad,
        desperdicio_pct: 0.05,
        costo_unit: costo,
        honorarios_pct: 0.15,
        precio_unit: precioUnit,
        total: Math.round(precioUnit * cantidad * 1.05),
        proveedor_alias: 'MOCK',
        order_index: j * 10 + i
      });
    }
  }
  
  return budget_id;
}

async function createBudgetEjecutivo(project_id: UUID): Promise<UUID> {
  const { data: budget, error } = await supa
    .from('budgets')
    .insert({
      project_id,
      type: 'ejecutivo',
      status: 'publicado',
      cliente_view_enabled: true,
      iva_enabled: true,
      shared_with_construction: true,
      notas: `${MOCK_TAG} ${MOCK_BATCH}`
    })
    .select('id')
    .single();
  
  if (error) throw error;
  const budget_id = budget!.id as UUID;

  // Insert detailed budget items
  for (let j = 0; j < mayoresEj.length; j++) {
    const mj = mayoresEj[j];
    for (let i = 0; i < 4; i++) {
      const costo = rint(7000, 60000);
      const cantidad = rint(3, 12);
      const precioUnit = Math.round(costo * 1.18);
      
      await supa.from('budget_items').insert({
        budget_id,
        descripcion: `${mj.name} - Ejecutivo ${i + 1} [${MOCK_TAG}]`,
        unidad: rand(['m2', 'pza', 'm', 'lote', 'kg']),
        cant_necesaria: cantidad,
        cant_real: Math.round(cantidad * 1.08),
        desperdicio_pct: 0.08,
        costo_unit: costo,
        honorarios_pct: 0.18,
        precio_unit: precioUnit,
        total: Math.round(precioUnit * cantidad * 1.08),
        proveedor_alias: 'EXEC',
        order_index: j * 10 + i
      });
    }
  }
  
  return budget_id;
}

async function createGantt(project_id: UUID): Promise<void> {
  const { data, error } = await supa
    .from('gantt_plans')
    .insert({
      project_id,
      type: 'construccion',
      shared_with_construction: true
    })
    .select('id')
    .single();
  
  if (error) throw error;
  const gantt_id = data!.id as UUID;

  const start = new Date(today);
  for (let i = 0; i < mayoresEj.length; i++) {
    const s = new Date(start);
    s.setDate(s.getDate() + i * 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    
    await supa.from('gantt_items').insert({
      gantt_id,
      major_id: null,
      start_date: s.toISOString().split('T')[0],
      end_date: e.toISOString().split('T')[0],
      order_index: i
    });
  }
}

async function createPOsAndMovements(
  project_id: UUID,
  bank_account_id: UUID,
  provider_id: UUID
): Promise<void> {
  // Create 2 purchase orders, mark 1 as received
  for (let i = 0; i < 2; i++) {
    const qty = rint(5, 15);
    const precioUnit = rint(2000, 12000);
    const total = qty * precioUnit;
    
    const { data: po, error } = await supa
      .from('purchase_orders')
      .insert({
        project_id,
        proveedor_id: provider_id,
        subpartida_id: null,
        qty_solicitada: qty,
        qty_ordenada: qty,
        qty_recibida: i === 0 ? qty : 0,
        estado: i === 0 ? 'recibido' : 'ordenado',
        fecha_requerida: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notas: `OC Mock ${MOCK_TAG} ${MOCK_BATCH}`
      })
      .select('id')
      .single();
    
    if (error) throw error;

    // If received, create egreso transaction
    if (i === 0) {
      await supa.from('transactions').insert({
        bank_account_id,
        tipo: 'egreso',
        proyecto_id: project_id,
        proveedor_id: provider_id,
        monto: total,
        moneda: 'MXN',
        fecha: new Date().toISOString().split('T')[0],
        concepto: `Pago OC ${po!.id} [${MOCK_TAG}]`
      });
    }
  }

  // Create 1 ingreso (client deposit)
  await supa.from('transactions').insert({
    bank_account_id,
    tipo: 'ingreso',
    proyecto_id: project_id,
    monto: rint(80000, 180000),
    moneda: 'MXN',
    fecha: new Date().toISOString().split('T')[0],
    concepto: `Depósito cliente [${MOCK_TAG}]`
  });
}

async function createCalendarAndChat(project_id: UUID): Promise<void> {
  const start = new Date();
  start.setDate(start.getDate() + rint(1, 7));
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  
  await supa.from('calendar_events').insert({
    project_id,
    title: `Revisión de avance [${MOCK_TAG}]`,
    notes: `Cita de seguimiento mock - ${MOCK_BATCH}`,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    attendees: [],
    created_by: null
  });

  // Create 2 chat messages
  await supa.from('project_messages').insert([
    { 
      project_id, 
      sender_id: null, 
      message: `Hola desde seed [${MOCK_TAG}]` 
    },
    { 
      project_id, 
      sender_id: null, 
      message: `Siguiente paso agendado [${MOCK_TAG}]` 
    }
  ]);
}

async function main() {
  console.log('🌱 Seeding mock data…');
  
  // Create base providers and bank
  const provId = await upsertProvider('Proveedor Demo');
  const bankId = await upsertBank('Banco Demo');
  const bankAccId = await ensureBankAccount(bankId!);

  console.log('✅ Base providers and bank created');

  // Create 10 clients with different flows
  for (let i = 1; i <= 10; i++) {
    console.log(`\n📝 Creating client ${i}/10...`);
    
    const clientId = await createLeadAndClient(i);
    const projectId = await createProject(clientId, i);

    if (i <= 4) {
      // Flow 1: Architecture only (4 clients)
      console.log(`   ├─ Flow: Arquitectónico only`);
      await createBudgetParametrico(projectId);
    } else if (i <= 7) {
      // Flow 2: Architecture → Executive (3 clients)
      console.log(`   ├─ Flow: Arquitectónico → Ejecutivo`);
      await createBudgetParametrico(projectId);
      await createBudgetEjecutivo(projectId);
      await createGantt(projectId);
      await createCalendarAndChat(projectId);
    } else {
      // Flow 3: Complete (3 clients)
      console.log(`   ├─ Flow: Completo (Arq → Ejec → Construcción)`);
      await createBudgetParametrico(projectId);
      await createBudgetEjecutivo(projectId);
      await createGantt(projectId);
      await createPOsAndMovements(projectId, bankAccId!, provId!);
      await createCalendarAndChat(projectId);
    }
    
    console.log(`   ✓ Client ${i} completed`);
  }

  console.log('\n\n✅ Seed completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   • 10 clients with leads`);
  console.log(`   • 10 projects`);
  console.log(`   • 4 projects with Arquitectónico budget only`);
  console.log(`   • 3 projects with Arquitectónico + Ejecutivo`);
  console.log(`   • 3 projects with full flow (including construction)`);
  console.log(`\n🏷️  Tag: ${MOCK_TAG}`);
  console.log(`🏷️  Batch: ${MOCK_BATCH}`);
  console.log(`\n🧹 To cleanup: npm run seed:cleanup\n`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
