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

async function del(table: string, whereIlike: string[] = []): Promise<number> {
  let delCount = 0;

  for (const col of whereIlike) {
    const { count, error } = await supa
      .from(table)
      .delete({ count: 'exact' })
      .ilike(col, `%${MOCK_TAG}%`);
    
    if (error) {
      console.warn(`⚠️  Error deleting from ${table}.${col}:`, error.message);
    } else {
      delCount += count ?? 0;
    }
  }
  
  if (delCount > 0) {
    console.log(`   ✓ Deleted ${delCount} records from ${table}`);
  }
  
  return delCount;
}

async function main() {
  console.log('🧹 Cleaning up mock data…\n');
  
  let totalDeleted = 0;

  // Order matters: children → parents
  console.log('📝 Deleting project-related data...');
  totalDeleted += await del('project_messages', ['message']);
  totalDeleted += await del('calendar_events', ['title', 'notes']);
  totalDeleted += await del('purchase_orders', ['notas']);
  totalDeleted += await del('transactions', ['concepto']);

  console.log('\n📊 Deleting budget and gantt data...');
  totalDeleted += await del('gantt_items', []);
  totalDeleted += await del('gantt_plans', []);
  totalDeleted += await del('budget_items', ['descripcion']);
  totalDeleted += await del('budgets', ['notas']);

  console.log('\n🏗️  Deleting projects and clients...');
  totalDeleted += await del('projects', ['notas']);
  totalDeleted += await del('clients', ['name']);
  totalDeleted += await del('leads', ['nombre_completo', 'notas']);

  console.log('\n🏦 Deleting banks and providers...');
  totalDeleted += await del('bank_accounts', []);
  
  // For banks and providers, we need to be more careful
  // Delete accounts first, then banks
  const { data: mockBanks } = await supa
    .from('banks')
    .select('id')
    .ilike('nombre', `%${MOCK_TAG}%`);
  
  if (mockBanks && mockBanks.length > 0) {
    for (const bank of mockBanks) {
      await supa.from('bank_accounts').delete().eq('bank_id', bank.id);
    }
  }
  
  totalDeleted += await del('banks', ['nombre']);
  totalDeleted += await del('providers', ['name']);

  console.log('\n✅ Cleanup completed!');
  console.log(`📊 Total records deleted: ${totalDeleted}`);
  console.log(`🏷️  Tag: ${MOCK_TAG}`);
  console.log(`🏷️  Batch: ${MOCK_BATCH}\n`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
