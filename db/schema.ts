import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const readingDays = sqliteTable('reading_days', {
  day: text('day').primaryKey(),
  salt: text('salt').notNull(),
});

export const readingAttempts = sqliteTable('reading_attempts', {
  day: text('day').notNull(),
  requestId: text('request_id').notNull(),
  actor: text('actor').notNull(),
}, table => [
  primaryKey({ columns: [table.day, table.requestId] }),
  index('reading_attempts_day_actor').on(table.day, table.actor),
]);
