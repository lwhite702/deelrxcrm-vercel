import { NextResponse } from 'next/server';
import { getActiveTenant } from '@/lib/tenant';
import { withTenant } from '@/lib/db/withTenant';
import { sql } from 'drizzle-orm';

export async function GET() {
  const tenant = await getActiveTenant();
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await withTenant(tenant.id, async (dbScoped) => {
    // Placeholder KPI queries; replace with real aggregates
    // Example guarded query:
    // const [{ count: customers }] = await dbScoped.execute(sql`select count(*)::int as count from customers where tenant_id = current_setting('app.tenant_id')::uuid`);
    const customers = 0;
    const inventory = 0;
    const payments = 0;
    return { customers, inventory, payments };
  });

  return NextResponse.json(data);
}
