import { Router } from "express";
import { db, nodesTable, clientsTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { checkWireguardLive } from "../lib/wireguard.js";
import { buildSshOpts } from "../lib/node-ssh.js";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  try {
    const [nodeCount] = await db.select({ cnt: count() }).from(nodesTable);
    const [clientCount] = await db.select({ cnt: count() }).from(clientsTable);
    const nodes = await db.select().from(nodesTable);

    const wgNodes = nodes.filter(n => n.serverPublicKey && n.wireguardInterface);

    const liveStatuses = await Promise.all(wgNodes.map(async (n) => {
      return checkWireguardLive(buildSshOpts(n), n.wireguardInterface!);
    }));

    const runningCount = liveStatuses.filter(s => s === "running").length;

    res.json({
      totalNodes: Number(nodeCount?.cnt ?? 0),
      onlineNodes: runningCount,
      totalClients: Number(clientCount?.cnt ?? 0),
      nodesWithWireguard: wgNodes.length,
    });
  } catch (err) {
    req.log.error({ err }, "getDashboardSummary failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
