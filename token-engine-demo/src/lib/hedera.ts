import { 
    Client, 
    PrivateKey, 
    AccountId,
    TokenAssociateTransaction,
    TransferTransaction
} from "@hashgraph/sdk";

export class HederaService {
    private client: Client;

    constructor() {
        // Initialize the client based on environment
        this.client = Client.forTestnet();
    }

    async associateToken(accountId: string, tokenId: string, privateKey: string): Promise<Uint8Array> {
        const transaction = new TokenAssociateTransaction()
            .setAccountId(AccountId.fromString(accountId))
            .setTokenIds([tokenId]);

        const userKey = PrivateKey.fromString(privateKey);
        const signedTx = await transaction.sign(userKey);
        return signedTx.toBytes();
    }

    async createRedeemTransaction(
        accountId: string,
        tokenId: string,
        amount: number,
        privateKey: string
    ): Promise<Uint8Array> {
        const transaction = new TransferTransaction()
            .addTokenTransfer(tokenId, AccountId.fromString(accountId), -amount)
            .addTokenTransfer(tokenId, AccountId.fromString(process.env.TREASURY_ID!), amount);

        const userKey = PrivateKey.fromString(privateKey);
        const signedTx = await transaction.sign(userKey);
        return signedTx.toBytes();
    }

    // Add more Hedera operations as needed
}

export const hederaService = new HederaService(); 