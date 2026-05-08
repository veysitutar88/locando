import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from './client';
import { restaurants } from './schema';
import { NotFoundError } from './errors';
import { withTimestamps } from './helpers';

export type Restaurant = typeof restaurants.$inferSelect;
export type RestaurantInsert = typeof restaurants.$inferInsert;
export type RestaurantUpdate = Partial<
  Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt' | 'slug'>
>;

export const restaurantsRepo = {
  async findBySlug(slug: string): Promise<Restaurant | null> {
    const row = await db.query.restaurants.findFirst({
      where: eq(restaurants.slug, slug),
    });
    return row ?? null;
  },

  async findById(id: string): Promise<Restaurant | null> {
    const row = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, id),
    });
    return row ?? null;
  },

  async create(data: RestaurantInsert): Promise<Restaurant> {
    const [row] = await db.insert(restaurants).values(data).returning();
    return row;
  },

  async update(id: string, data: RestaurantUpdate): Promise<Restaurant> {
    const [row] = await db
      .update(restaurants)
      .set(withTimestamps(data))
      .where(eq(restaurants.id, id))
      .returning();
    if (!row) throw new NotFoundError('restaurant', id);
    return row;
  },
};
