import { PrivateKey, Transaction } from "@hashgraph/sdk";

async function main() {
    // Get the base64 transaction from command line argument
    const base64Transaction = process.argv[2];
    
    if (!base64Transaction) {
        console.error('Please provide the base64 transaction as an argument');
        process.exit(1);
    }

    try {
        // Convert base64 to bytes
        const transactionBytes = Buffer.from(base64Transaction, 'base64');

        // Convert bytes to transaction
        const transaction = Transaction.fromBytes(transactionBytes);

        // Sign with test private key
        const privateKey = PrivateKey.fromString("302e020100300506032b657004220420534c515280076a8de1113275dd1ea0f0940fd43675f588a91ca7dbcc73dda68b");
        const signedTx = await transaction.sign(privateKey);
        
        // Convert signed transaction to base64
        const signedBytes = signedTx.toBytes();
        const signedBase64 = Buffer.from(signedBytes).toString('base64');

        console.log('Signed transaction (base64):');
        console.log(signedBase64);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main(); 