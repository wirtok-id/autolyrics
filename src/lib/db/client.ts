import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Neon PostgreSQL connection
const connectionString = process.env.DATABASE_URL!;

// Create postgres connection
const client = postgres(connectionString);

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });
