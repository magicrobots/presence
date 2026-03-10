import { pgTable, serial, varchar, timestamptz } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id:            serial('id').primaryKey(),
  username:      varchar('username', { length: 255 }).notNull().unique(),
  qualityPreset: varchar('quality_preset', { length: 10 }).notNull().default('normal'),
  createdAt:     timestamptz('created_at').notNull().defaultNow(),
  updatedAt:     timestamptz('updated_at').notNull().defaultNow(),
});
