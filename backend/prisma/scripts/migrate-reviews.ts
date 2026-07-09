/**
 * Migrate product_reviews → product_ratings + product_comments
 * Usage:
 *   npx ts-node prisma/scripts/migrate-reviews.ts --dry-run
 *   npx ts-node prisma/scripts/migrate-reviews.ts
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

  const legacyReviews = await prisma.$queryRaw<
    { id: bigint; user_id: bigint | null; product_id: bigint; rating: number; comment: string | null; created_at: Date }[]
  >`SELECT id, user_id, product_id, rating, comment, created_at FROM product_reviews ORDER BY id`;

  if (legacyReviews.length === 0) {
    console.log('No product_reviews rows to migrate.');
    await cleanup(prisma, dryRun);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const usedOrders = new Set<string>();
  let migratedRatings = 0;
  let legacyNullOrder = 0;
  let migratedComments = 0;
  let skipped = 0;

  const beforeAgg = await prisma.$queryRaw<{ cnt: bigint; sum: bigint | null }[]>`
    SELECT COUNT(*)::bigint AS cnt, COALESCE(SUM(rating), 0)::bigint AS sum FROM product_reviews WHERE rating BETWEEN 1 AND 5`;

  for (const row of legacyReviews) {
    if (row.rating >= 1 && row.rating <= 5 && row.user_id) {
      const orders = await prisma.order.findMany({
        where: {
          userId: row.user_id,
          status: { in: ['delivered', 'completed'] },
          paymentStatus: 'paid',
          items: { some: { productId: row.product_id } },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, createdAt: true },
      });

      let orderId: bigint | null = null;
      for (const o of orders) {
        const key = `${o.id.toString()}:${row.product_id.toString()}`;
        if (!usedOrders.has(key)) {
          orderId = o.id;
          usedOrders.add(key);
          break;
        }
      }

      if (!orderId) {
        legacyNullOrder++;
        console.log(`[rating] review ${row.id} → legacy (orderId=null)`);
      } else {
        console.log(`[rating] review ${row.id} → order ${orderId}`);
      }

      if (!dryRun) {
        await prisma.productRating.create({
          data: {
            userId: row.user_id,
            productId: row.product_id,
            orderId,
            rating: row.rating,
            images: [],
            createdAt: row.created_at,
            updatedAt: row.created_at,
          },
        });
      }
      migratedRatings++;
    }

    if (row.comment?.trim()) {
      if (!row.user_id) {
        skipped++;
        console.log(`[comment] review ${row.id} skipped (no user)`);
        continue;
      }
      console.log(`[comment] review ${row.id} → product_comments`);
      if (!dryRun) {
        await prisma.productComment.create({
          data: {
            userId: row.user_id,
            productId: row.product_id,
            content: row.comment.trim(),
            images: [],
            status: 'active',
            createdAt: row.created_at,
            updatedAt: row.created_at,
          },
        });
      }
      migratedComments++;
    }
  }

  const afterCount = dryRun
    ? Number(beforeAgg[0]?.cnt ?? 0)
    : Number(
        (
          await prisma.$queryRaw<{ cnt: bigint }[]>`
            SELECT COUNT(*)::bigint AS cnt FROM product_ratings`
        )[0]?.cnt ?? 0,
      );

  const report = {
    dryRun,
    legacyRows: legacyReviews.length,
    migratedRatings,
    migratedComments,
    legacyNullOrder,
    skipped,
    ratingCountBefore: Number(beforeAgg[0]?.cnt ?? 0),
    ratingCountAfter: afterCount,
  };

  console.log('\n=== Migration report ===');
  console.log(JSON.stringify(report, null, 2));

  if (!dryRun && report.ratingCountBefore !== report.ratingCountAfter) {
    console.warn('WARNING: rating count mismatch — not dropping product_reviews');
  } else if (!dryRun) {
    await cleanup(prisma, false);
  }

  await prisma.$disconnect();
  await pool.end();
}

async function cleanup(prisma: PrismaClient, dry: boolean) {
  if (dry) {
    console.log('[dry-run] Would DROP TABLE product_reviews');
    return;
  }
  const exists = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'product_reviews'
    ) AS exists`;
  if (exists[0]?.exists) {
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS product_reviews CASCADE');
    console.log('Dropped product_reviews');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
