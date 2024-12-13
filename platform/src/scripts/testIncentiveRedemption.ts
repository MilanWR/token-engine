import dotenv from 'dotenv';
import axios from 'axios';
import { Transaction, PrivateKey } from "@hashgraph/sdk";

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.TEST_API_KEY;

async function testIncentiveRedemption() {
    try {
        if (!API_KEY) {
            throw new Error('TEST_API_KEY environment variable is required');
        }

        const accountId = process.env.USER_ACCOUNT_ID;
        if (!accountId) {
            throw new Error('TEST_ACCOUNT_ID environment variable is required');
        }

        console.log('\n1. Creating redeem request...');
        const redeemResponse = await axios.post(
            `${API_URL}/api/v1/incentive/redeem`,
            {
                accountId,
                amount: 50, // 0.50 tokens
                memo: 'test_redeem_script'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                }
            }
        );

        console.log('Redeem request created:', {
            accountId: redeemResponse.data.accountId,
            amount: redeemResponse.data.amount,
            memo: redeemResponse.data.memo
        });

        console.log('\n2. Signing transaction...');
        const signedTransaction = await signTransaction(redeemResponse.data);
        
        console.log('\n3. Submitting signed transaction...');
        const submitResponse = await axios.post(
            `${API_URL}/api/v1/incentive/redeem/submit`,
            {
                accountId,
                signedTransaction: signedTransaction.signedTransaction
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                }
            }
        );

        console.log('Redemption complete:', submitResponse.data);

    } catch (error) {
        console.error('Error in test script:', error);
        if (axios.isAxiosError(error)) {
            console.error('Response data:', error.response?.data);
        }
        process.exit(1);
    }
}

async function signTransaction(data: { unsignedRedeemTransaction: string; accountId: string }) {
    try {
        const privateKeyString = process.env.USER_PRIVATE_KEY;
        if (!privateKeyString) {
            throw new Error('USER_PRIVATE_KEY environment variable is required');
        }

        const privateKey = PrivateKey.fromString(privateKeyString);
        const transaction = Transaction.fromBytes(
            Buffer.from(data.unsignedRedeemTransaction, 'base64')
        );

        const signedTx = await transaction.sign(privateKey);
        const signedTxBytes = signedTx.toBytes();

        return {
            signedTransaction: Buffer.from(signedTxBytes).toString('base64'),
            accountId: data.accountId
        };
    } catch (error) {
        console.error('Error signing transaction:', error);
        throw error;
    }
}

// Run the test
testIncentiveRedemption().catch(console.error); 