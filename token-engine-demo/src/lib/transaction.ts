import { cryptoService } from './crypto';
import { PrivateKey } from '@hashgraph/sdk';

export class TransactionService {
    async signTransaction(
        transactionBytes: Uint8Array,
        encryptedPrivateKey: string,
        password: string
    ): Promise<string> {
        try {
            // Decrypt the private key
            const privateKeyString = await cryptoService.decryptPrivateKey(
                encryptedPrivateKey,
                password
            );

            // Convert to Hedera PrivateKey
            const privateKey = PrivateKey.fromString(privateKeyString);

            // Sign the transaction
            const signedBytes = await privateKey.signTransaction(transactionBytes);

            // Convert to base64 for API transmission
            return Buffer.from(signedBytes).toString('base64');
        } catch (error) {
            console.error('Transaction signing error:', error);
            throw new Error('Failed to sign transaction');
        }
    }
}

export const transactionService = new TransactionService(); 