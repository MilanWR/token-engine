import { Transaction, PrivateKey } from "@hashgraph/sdk";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = "302e020100300506032b657004220420534c515280076a8de1113275dd1ea0f0940fd43675f588a91ca7dbcc73dda68b";
const API_KEY = "te_d31eae94b0d20ad2b5bb91b4a0f9e45cc1920c704c42ffa6";

async function main() {
    try {
        const args = process.argv[2];
        const { unsignedWithdrawTransaction, accountId, uid } = JSON.parse(args);

        // Decode base64 to buffer
        const buffer = Buffer.from(unsignedWithdrawTransaction, 'base64');
        
        // Convert to Transaction
        const transaction = Transaction.fromBytes(buffer);
        
        // Sign with hardcoded private key
        const privateKey = PrivateKey.fromString(PRIVATE_KEY);
        const signedTx = await transaction.sign(privateKey);
        
        // Get signed bytes and encode to base64
        const signedBytes = signedTx.toBytes();
        const signedBase64 = Buffer.from(signedBytes).toString('base64');
        
        console.log('\nSigned transaction (base64):', signedBase64);

        // Submit to API
        const response = await axios.post('http://localhost:3000/api/consent/withdraw/submit', {
            signedTransaction: signedBase64,
            accountId,
            uid
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        console.log('API Response:', response.data);
    } catch (error: any) {
        console.error('API Error:', {
            error: error.response?.data?.error || error.message,
            details: error.response?.data?.details || error.stack
        });
    }
}

main(); 