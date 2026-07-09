/**
 * One-off: normalize legacy order status `completed` → `delivered`.
 * Usage:
 *   npx ts-node prisma/scripts/migrate-order-status.ts --dry-run
 *   npx ts-node prisma/scripts/migrate-order-status.ts
 */
import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const count = await prisma.order.count({ where: { status: 'completed' } });
  console.log(`Orders with status "completed": ${count}`);

  if (count === 0) {
    console.log('Nothing to migrate.');
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  if (dryRun) {
    console.log('[dry-run] Would run: UPDATE orders SET status = delivered WHERE status = completed');
  } else {
    const result = await prisma.order.updateMany({
      where: { status: 'completed' },
      data: { status: 'delivered' },
    });
    console.log(`Updated ${result.count} order(s) to "delivered".`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
