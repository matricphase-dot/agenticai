import { prisma } from "../lib/prisma";
import { encryptionService } from "./encryption.service";

export class SecretService {
  static async createSecret(userId: string, name: string, value: string) {
    const { encrypted, iv } = encryptionService.encrypt(value);
    
    return prisma.secret.create({
      data: {
        userId,
        name,
        value: encrypted,
        iv
      }
    });
  }

  static async getSecretsForUser(userId: string) {
    return prisma.secret.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true }
    });
  }

  static async deleteSecret(userId: string, secretId: string) {
    return prisma.secret.delete({
      where: { id: secretId, userId }
    });
  }

  static async getDecryptedSecret(userId: string, secretId: string) {
    const secret = await prisma.secret.findFirst({
      where: { id: secretId, userId }
    });
    if (!secret) throw new Error("Secret not found");
    
    return encryptionService.decrypt(secret.value, secret.iv);
  }

  static async bindSecretToAgent(agentId: string, secretId: string, envVar: string) {
    return prisma.agentSecretBinding.create({
      data: {
        agentId,
        secretId,
        envVar
      }
    });
  }
}
