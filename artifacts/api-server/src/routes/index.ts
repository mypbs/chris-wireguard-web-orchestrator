import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import dashboardRouter from "./dashboard.js";
import nodesRouter from "./nodes.js";
import clientsRouter from "./clients.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(nodesRouter);
router.use(clientsRouter);

export default router;
