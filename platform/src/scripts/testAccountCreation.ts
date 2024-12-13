// src/scripts/testTokenAssociation.ts
import axios from 'axios';
import { PrivateKey, Transaction } from "@hashgraph/sdk";
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = "te_7b2a64f8f8bd2aecf9b89c6091ed6834a03a94d79f287d55";
const PRIVATE_KEY = "302e020100300506032b657004220420534c515280076a8de1113275dd1ea0f0940fd43675f588a91ca7dbcc73dda68b";
const PUBLIC_KEY = "302a300506032b657003210062bb876d734927ab91c48034e591c082c3686cb7b17540f05dc82e7bced39376";

async function testTokenAssociation() {
    try {
        console.log('1. Creating new user account...');
        // Step 1: Create User
        const createUserResponse = await axios.post('http://localhost:3000/api/v1/users', {
            publicKey: PUBLIC_KEY
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        const { accountId, unsignedTokenAssociateTransaction } = createUserResponse.data;
        console.log('Account created:', accountId);

        // Step 2: Sign Transaction
        console.log('\n2. Signing transaction...');
        const buffer = Buffer.from(unsignedTokenAssociateTransaction, 'base64');
        const transaction = Transaction.fromBytes(buffer);
        const privateKey = PrivateKey.fromString(PRIVATE_KEY);
        const signedTx = await transaction.sign(privateKey);
        const signedBytes = signedTx.toBytes();
        const signedBase64 = Buffer.from(signedBytes).toString('base64');
        console.log('Transaction signed');

        // Step 3: Submit Token Association
        console.log('\n3. Submitting token association...');
        const submitResponse = await axios.post('http://localhost:3000/api/v1/users/token-association', {
            accountId,
            signedTransaction: signedBase64
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        console.log('Token association result:', submitResponse.data);

    } catch (error: any) {
        console.error('Error:', {
            message: error.response?.data?.error || error.message,
            details: error.response?.data?.details || error.stack
        });
    }
}

testTokenAssociation();