import { PrivateKey, Transaction } from "@hashgraph/sdk";
import { client } from "../config/hedera";

async function testSignTransaction() {
    try {
        // Get the response JSON from command line argument
        const responseJson = process.argv[2];
        if (!responseJson) {
            console.error('Please provide the API response as an argument');
            console.error('Example: npm run test-sign \'{"publicKey":"...","accountId":"...","unsignedTokenAssociateTransaction":"..."}\'');
            process.exit(1);
        }

        // Parse the response
        const response = JSON.parse(responseJson);
        const { unsignedTokenAssociateTransaction } = response;

        // Use the private key we generated earlier
        const privateKey = PrivateKey.fromString("302e020100300506032b657004220420534c515280076a8de1113275dd1ea0f0940fd43675f588a91ca7dbcc73dda68b");

        // Convert base64 to transaction
        const transactionBytes = Buffer.from(unsignedTokenAssociateTransaction, 'base64');
        const transaction = Transaction.fromBytes(transactionBytes);

        // Sign the transaction
        const signedTransaction = await transaction.sign(privateKey);

        // Convert signed transaction to base64
        const signedTransactionBytes = signedTransaction.toBytes();
        const signedTransactionBase64 = Buffer.from(signedTransactionBytes).toString('base64');

        console.log('\nSigned transaction (base64):', signedTransactionBase64);

        // Now we can use this to test the submit endpoint
        const submitResponse = await fetch('http://localhost:3000/api/v1/users/token-association', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'te_e2fdcf0141922016f40b9f27cd2732e4fd8df1ddcbc95e36'
            },
            body: JSON.stringify({
                signedTransaction: signedTransactionBase64
            })
        });

        const result = await submitResponse.json();
        console.log('\nSubmit response:', result);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the test
testSignTransaction(); 