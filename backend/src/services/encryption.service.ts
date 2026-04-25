import { encrypt, decrypt } from "../lib/encryption";

export class EncryptionService {
  encrypt(text: string) {
    return encrypt(text);
  }

  decrypt(encrypted: string, iv: string) {
    return decrypt(encrypted, iv);
  }
}

export const encryptionService = new EncryptionService();
