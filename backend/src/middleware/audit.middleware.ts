import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import logger from "../lib/logger";

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;

  // Capture mutating requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    (res as any).send = function (body: any) {
      res.send = originalSend;
      
      const userId = req.user?.id;
      if (userId) {
        // Run audit logging asynchronously
        const action = `${req.method} ${req.path}`;
        const metadata = { ...req.body };
        // Sanitize sensitive info
        delete metadata.password;
        delete metadata.newPassword;
        delete metadata.token;
        delete metadata.secret;

        prisma.auditLog.create({
          data: {
            userId,
            action,
            entityType: req.path.split("/")[2] || "UNKNOWN",
            metadata,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
          }
        }).catch(err => logger.error("Audit log creation failed", err));
      }

      return res.send(body);
    };
  }

  next();
};
