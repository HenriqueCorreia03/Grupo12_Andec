import { defineConfig } from 'drizzle-kit';

// Só gera as migrações SQL (npx drizzle-kit generate); quem as aplica é o ETL.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
