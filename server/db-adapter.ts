/**
 * Database Adapter
 * Switches between SQLite (dev) and MySQL (production) based on environment
 */

import { drizzle as drizzleMysql } from 'drizzle-orm/mysql2';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import * as schema from '../drizzle/schema.js';

const isDevelopment = process.env.NODE_ENV === 'development';
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

let db: any;

if (isDevelopment && databaseUrl.startsWith('file:')) {
  // SQLite for local development
  const dbPath = databaseUrl.replace('file:', '');
  console.log(`📦 Using SQLite database: ${dbPath}`);
  
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  
  db = drizzleSqlite(sqlite, { schema });
} else {
  // MySQL for production
  console.log(`📦 Using MySQL database`);
  
  const connection = await mysql.createConnection(databaseUrl);
  db = drizzleMysql(connection, { schema });
}

export { db };
export * from '../drizzle/schema.js';
