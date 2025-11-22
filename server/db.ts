import * as schema from "@shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Validate DATABASE_URL format
const dbUrl = process.env.DATABASE_URL;
if (dbUrl === 'DATABASE_URL' || !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  throw new Error(
    `Invalid DATABASE_URL format. Got: ${dbUrl.substring(0, 50)}... (Check Render environment variables)`,
  );
}

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

// Initialize database connection
export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle({ client: pool, schema });
