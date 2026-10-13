import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/*.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://mettle:mettle@localhost:5432/mettle',
  },
});
