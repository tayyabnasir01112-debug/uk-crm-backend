import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Support both Neon (serverless) and standard PostgreSQL (VPS)
// Auto-detect based on DATABASE_URL or DB_TYPE environment variable
const dbType = process.env.DB_TYPE || (process.env.DATABASE_URL.includes('neon.tech') ? 'neon' : 'postgres');

// Default to Neon for backward compatibility, but support PostgreSQL for VPS
let pool: any;
let db: any;

if (dbType === 'postgres' || dbType === 'pg') {
  // Standard PostgreSQL (for VPS hosting)
  // Use dynamic import for ES modules
  const pgModule = await import('pg');
  const drizzleModule = await import('drizzle-orm/node-postgres');
  
  pool = new pgModule.Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  db = drizzleModule.drizzle({ client: pool, schema });
} else {
  // Neon serverless (for cloud hosting like Render, Netlify, etc.)
  const neonModule = await import('@neondatabase/serverless');
  const ws = await import("ws");
  const drizzleModule = await import('drizzle-orm/neon-serverless');
  
  neonModule.neonConfig.webSocketConstructor = ws.default;
  pool = new neonModule.Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleModule.drizzle({ client: pool, schema });
}

export { pool, db };
