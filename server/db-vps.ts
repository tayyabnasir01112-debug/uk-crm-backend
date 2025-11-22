// Alternative database configuration for VPS hosting
// Use this if you're running PostgreSQL directly on your VPS (not Neon serverless)

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For VPS hosting, use standard PostgreSQL connection
// DATABASE_URL format: postgresql://user:password@localhost:5432/database
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for VPS
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle({ client: pool, schema });

