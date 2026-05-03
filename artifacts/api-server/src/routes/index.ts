import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import gamesRouter from "./games";
import challengesRouter from "./challenges";
import momentsRouter from "./moments";
import leaguesRouter from "./leagues";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(gamesRouter);
router.use(challengesRouter);
router.use(momentsRouter);
router.use(leaguesRouter);

export default router;
