import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id:            serial('id').primaryKey(),
  username:      varchar('username', { length: 255 }).notNull().unique(),
  qualityPreset: varchar('quality_preset', { length: 10 }).notNull().default('normal'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
