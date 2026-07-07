import { Router } from "express";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router = Router();

router.get("/auth/setup", async (req, res): Promise<void> => {
  try {
    const result = await db.select({ cnt: count() }).from(usersTable);
    const total = Number(result[0]?.cnt ?? 0);
    res.json({ setupRequired: total === 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to check setup status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/setup", async (req, res): Promise<void> => {
  try {
    const result = await db.select({ cnt: count() }).from(usersTable);
    const total = Number(result[0]?.cnt ?? 0);
    if (total > 0) {
      res.status(400).json({ error: "Setup already completed" });
      return;
    }

    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password || password.length < 6) {
      res.status(400).json({ error: "Username and password (min 6 chars) required" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db
      .insert(usersTable)
      .values({ username, passwordHash })
      .returning({ id: usersTable.id, username: usersTable.username });

    (req.session as any).userId = user.id;
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    req.log.error({ err }, "Setup failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user] = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      (req.session as any).userId = undefined;
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "getMe failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    (req.session as any).userId = user.id;
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

export default router;
