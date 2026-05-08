import { config } from 'dotenv';
config({ path: '.env.local' });

import { eq } from 'drizzle-orm';
import { db } from './client';
import { restaurants } from './schema';

async function seedJuneSix() {
  const existing = await db.query.restaurants.findFirst({
    where: eq(restaurants.slug, 'j6'),
  });
  if (existing) {
    console.log('June Six already exists:', existing.id);
    return;
  }
  const [created] = await db
    .insert(restaurants)
    .values({
      slug: 'j6',
      name: 'June Six Bistro Bar',
      ownerEmail: 'igor@j6restaurant.de',
      timezone: 'Europe/Berlin',
    })
    .returning();
  console.log('Created June Six:', created);
}

seedJuneSix().catch((err) => {
  console.error(err);
  process.exit(1);
});
