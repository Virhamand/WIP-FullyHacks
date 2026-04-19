import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle/schema.ts', // Make sure this points to the file you just fixed!
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: 'file:./sqlite.db',
  },
});