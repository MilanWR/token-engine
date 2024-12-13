import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'crypto';

export class CryptoService {
    private readonly ALGORITHM = 'aes-256-gcm';
    private readonly KEY_LENGTH = 32;
    private readonly IV_LENGTH = 12;
    private readonly SALT_LENGTH = 16;
    private readonly TAG_LENGTH = 16;

    async encryptPrivateKey(privateKey: string, password: string): Promise<string> {
        try {
            // Generate salt and derive key
            const salt = randomBytes(this.SALT_LENGTH);
            const key = scryptSync(password, salt, this.KEY_LENGTH);
            
            // Generate IV
            const iv = randomBytes(this.IV_LENGTH);
            
            // Create cipher
            const cipher = createCipheriv(this.ALGORITHM, key, iv);
            
            // Encrypt
            const encrypted = Buffer.concat([
                cipher.update(privateKey, 'utf8'),
                cipher.final()
            ]);
            
            // Get auth tag
            const tag = cipher.getAuthTag();
            
            // Combine salt + iv + tag + encrypted data
            const combined = Buffer.concat([
                salt,
                iv,
                tag,
                encrypted
            ]);
            
            return combined.toString('base64');
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    }

    async decryptPrivateKey(encryptedData: string, password: string): Promise<string> {
        try {
            const combined = Buffer.from(encryptedData, 'base64');
            
            // Extract parts
            const salt = combined.slice(0, this.SALT_LENGTH);
            const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
            const tag = combined.slice(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
            const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
            
            // Derive key
            const key = scryptSync(password, salt, this.KEY_LENGTH);
            
            // Create decipher
            const decipher = createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(tag);
            
            // Decrypt
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Decryption error:', error);
            throw error;
        }
    }
}

export const cryptoService = new CryptoService(); 