import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const wireguardStatusEnum = pgEnum("wireguard_status", [
  "not_installed",
  "stopped",
  "running",
  "unknown",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const nodesTable = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  sshUser: text("ssh_user").notNull(),
  sshAuthMethod: text("ssh_auth_method").notNull().default("password"),
  sshPasswordEncrypted: text("ssh_password_encrypted"),
  sshPrivateKeyEncrypted: text("ssh_private_key_encrypted"),
  sshPort: integer("ssh_port").notNull().default(22),
  wireguardPort: integer("wireguard_port").notNull().default(51820),
  wireguardInterface: text("wireguard_interface").notNull().default("wg0"),
  wireguardStatus: wireguardStatusEnum("wireguard_status").notNull().default("not_installed"),
  wireguardSubnet: text("wireguard_subnet").notNull().default("10.0.0.0/24"),
  serverPublicKey: text("server_public_key"),
  serverPrivateKey: text("server_private_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNodeSchema = createInsertSchema(nodesTable).omit({ id: true, createdAt: true });
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodesTable.$inferSelect;

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  nodeId: integer("node_id").notNull().references(() => nodesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  presharedKey: text("preshared_key").notNull(),
  allowedIps: text("allowed_ips").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
