import * as schema from "@shared/schema";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean up DATABASE_URL - remove common prefixes/suffixes
let dbUrl = process.env.DATABASE_URL.trim();
// Remove 'psql ' prefix if present
if (dbUrl.startsWith('psql ')) {
  dbUrl = dbUrl.substring(5).trim();
}
// Remove surrounding quotes if present
if ((dbUrl.startsWith("'") && dbUrl.endsWith("'")) || (dbUrl.startsWith('"') && dbUrl.endsWith('"'))) {
  dbUrl = dbUrl.slice(1, -1).trim();
}

// Validate DATABASE_URL format
if (dbUrl === 'DATABASE_URL' || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
  throw new Error(
    `Invalid DATABASE_URL format. Got: ${dbUrl.substring(0, 50)}... (Should start with postgresql://)`,
  );
}

// Configure Neon for serverless
neonConfig.webSocketConstructor = ws;

// Initialize database connection
export const pool = new Pool({ connectionString: dbUrl });
export const db = drizzle({ client: pool, schema });

// Log successful connection (without exposing credentials)
console.log('✅ Database connected:', dbUrl.split('@')[1] || 'connected');
