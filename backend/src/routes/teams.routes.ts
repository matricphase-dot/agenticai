import { Router } from "express";
import { TeamService } from "../services/team.service";
import { authMiddleware } from "../middleware/auth.middleware";
import { auditMiddleware } from "../middleware/audit.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req: any, res, next) => {
  try {
    const teams = await TeamService.getTeams(req.user.id);
    res.json({ success: true, data: teams });
  } catch (err) {
    next(err);
  }
});

router.post("/", auditMiddleware, async (req: any, res, next) => {
  try {
    const team = await TeamService.createTeam(req.user.id, req.body.name, req.body.description);
    res.status(201).json({ success: true, data: team });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/invite", auditMiddleware, async (req: any, res, next) => {
  try {
    await TeamService.inviteMember(req.params.id, req.user.id, req.body.email, req.body.role);
    res.json({ success: true, message: "Invite sent" });
  } catch (err) {
    next(err);
  }
});

export default router;
