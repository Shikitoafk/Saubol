import { Router, type IRouter } from "express";
import healthRouter from "./health";
import programsRouter from "./programs";
import satRouter from "./sat";
import testProxyRouter from "./test-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(programsRouter);
router.use(satRouter);
router.use(testProxyRouter);

export default router;
