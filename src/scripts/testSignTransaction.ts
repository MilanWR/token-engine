import { Transaction, PrivateKey } from "@hashgraph/sdk";
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    try {
        const args = process.argv[2];
        if (!args) {
            throw new Error('No transaction data provided');
        }

        const data = JSON.parse(args);
        const { unsignedRedeemTransaction, unsignedTokenAssociateTransaction, accountId } = data;

        if (!accountId) {
            throw new Error('Account ID is required');
        }

        // Get the private key from environment
        const privateKeyString = process.env.USER_PRIVATE_KEY;
        if (!privateKeyString) {
            throw new Error('USER_PRIVATE_KEY environment variable is required');
        }
        const privateKey = PrivateKey.fromString(privateKeyString);

        let transaction;
        if (unsignedRedeemTransaction) {
            // Handle redeem transaction
            transaction = Transaction.fromBytes(
                Buffer.from(unsignedRedeemTransaction, 'base64')
            );
        } else if (unsignedTokenAssociateTransaction) {
            // Handle token associate transaction
            transaction = Transaction.fromBytes(
                Buffer.from(unsignedTokenAssociateTransaction, 'base64')
            );
        } else {
            throw new Error('No valid transaction provided');
        }

        const signedTransaction = await transaction.sign(privateKey);
        const signedTransactionBytes = signedTransaction.toBytes();
        
        console.log(JSON.stringify({
            signedTransaction: Buffer.from(signedTransactionBytes).toString('base64'),
            accountId
        }));
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main(); 