import { pool } from "@workspace/db";
import { logger } from "./logger.js";

export async function runMigrations(): Promise<void> {
  logger.info("Running database migrations...");

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE wireguard_status AS ENUM ('not_installed', 'stopped', 'running', 'unknown');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS nodes (
      id                     SERIAL PRIMARY KEY,
      name                   TEXT NOT NULL,
      ip_address             TEXT NOT NULL,
      ssh_user               TEXT NOT NULL,
      ssh_password_encrypted TEXT NOT NULL,
      ssh_port               INTEGER NOT NULL DEFAULT 22,
      wireguard_port         INTEGER NOT NULL DEFAULT 51820,
      wireguard_interface    TEXT NOT NULL DEFAULT 'wg0',
      wireguard_status       wireguard_status NOT NULL DEFAULT 'not_installed',
      wireguard_subnet       TEXT NOT NULL DEFAULT '10.0.0.0/24',
      server_public_key      TEXT,
      server_private_key     TEXT,
      created_at             TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id            SERIAL PRIMARY KEY,
      node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      public_key    TEXT NOT NULL,
      private_key   TEXT NOT NULL,
      preshared_key TEXT NOT NULL,
      allowed_ips   TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `);

  // v0.1.1: SSH private key support
  await pool.query(`
    ALTER TABLE nodes
      ADD COLUMN IF NOT EXISTS ssh_auth_method TEXT NOT NULL DEFAULT 'password',
      ADD COLUMN IF NOT EXISTS ssh_private_key_encrypted TEXT
  `);

  await pool.query(`
    ALTER TABLE nodes ALTER COLUMN ssh_password_encrypted DROP NOT NULL
  `);

  logger.info("Database migrations complete");
}
