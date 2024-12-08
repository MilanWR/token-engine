import { Transaction, PrivateKey } from "@hashgraph/sdk";

async function main() {
    try {
        const args = process.argv[2];
        const { unsignedTokenAssociateTransaction, accountId } = JSON.parse(args);

        // Decode base64 to buffer
        const buffer = Buffer.from(unsignedTokenAssociateTransaction, 'base64');
        
        // Convert to Transaction
        const transaction = Transaction.fromBytes(buffer);
        
        // Sign with private key
        const privateKey = PrivateKey.fromString("302e020100300506032b657004220420534c515280076a8de1113275dd1ea0f0940fd43675f588a91ca7dbcc73dda68b");
        const signedTx = await transaction.sign(privateKey);
        
        // Get signed bytes and encode to base64
        const signedBytes = signedTx.toBytes();
        const signedBase64 = Buffer.from(signedBytes).toString('base64');
        
        console.log('\nSigned transaction (base64):', signedBase64);
    } catch (error) {
        console.error('Error:', error);
    }
}

main(); 