import crypto from 'crypto';
import { prisma } from '../lib/prisma';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

if (!process.env.ENCRYPTION_KEY || 
    Buffer.from(process.env.ENCRYPTION_KEY, 'hex').length !== 32) {
  throw new Error(
    'ENCRYPTION_KEY must be a 64-char hex string (32 bytes)'
  );
}

export const SecretsService = {

  encrypt: (plaintext: string): { encrypted: string; iv: string } => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      encrypted: encrypted + ':' + authTag,
      iv: iv.toString('hex'),
    };
  },

  decrypt: (encrypted: string, ivHex: string): string => {
    const [encryptedData, authTag] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },

  // Get all secrets bound to an agent, decrypted
  getAgentSecrets: async (
    agentId: string
  ): Promise<Record<string, string>> => {
    const bindings = await prisma.agentSecretBinding.findMany({
      where: { agentId },
      include: { secret: true },
    });

    const result: Record<string, string> = {};
    for (const binding of bindings) {
      try {
        result[binding.envVar] = SecretsService.decrypt(
          binding.secret.value,
          binding.secret.iv
        );
      } catch {
        // Skip secrets that fail to decrypt
      }
    }
    return result;
  },

  // Store a secret (encrypted)
  storeSecret: async (
    userId: string,
    name: string,
    value: string
  ) => {
    const { encrypted, iv } = SecretsService.encrypt(value);
    return prisma.secret.upsert({
      where: { userId_name: { userId, name } },
      create: { userId, name, value: encrypted, iv },
      update: { value: encrypted, iv },
    });
  },
};
