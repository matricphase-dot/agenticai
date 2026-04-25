import { prisma } from "../lib/prisma";
import { TeamRole } from "@prisma/client";
import crypto from "crypto";

export class TeamService {
  static async createTeam(ownerId: string, name: string, description?: string) {
    const slug = name.toLowerCase().replace(/ /g, '-');
    return prisma.team.create({
      data: {
        name,
        slug,
        description,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: TeamRole.OWNER
          }
        }
      }
    });
  }

  static async getTeams(userId: string) {
    return prisma.team.findMany({
      where: {
        members: { some: { userId } }
      },
      include: {
        _count: { select: { members: true, agents: true } }
      }
    });
  }

  static async inviteMember(teamId: string, inviterId: string, email: string, role: TeamRole = TeamRole.MEMBER) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.ownerId !== inviterId) throw new Error("Unauthorized");

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.teamInvite.create({
      data: {
        teamId,
        inviterId,
        email,
        token,
        role,
        expiresAt
      }
    });
  }
}
