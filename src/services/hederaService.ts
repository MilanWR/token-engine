import { 
    AccountCreateTransaction,
    TokenAssociateTransaction,
    TokenMintTransaction,
    TransferTransaction,
    PublicKey,
    AccountId,
    TokenId,
    Hbar,
    Transaction,
    TransactionResponse,
    TokenCreateTransaction,
    TokenSupplyType,
    TokenType,
    Client,
    PrivateKey,
    Status
} from "@hashgraph/sdk";
import { client, operatorKey, operatorPublicKey } from "../config/hedera";

interface MintNFTResult {
    serialNumber: number;
    transactionId: string;
}

interface TransferNFTResult {
    transactionId: string;
}

export class HederaService {
    private client: Client;
    private operatorId: AccountId;
    private operatorKey: PrivateKey;
    private treasuryId: AccountId;
    private tokenId: TokenId;

    constructor() {
        // Initialize client from config
        this.client = client;

        // Get operator details from config
        this.operatorId = AccountId.fromString(process.env.HEDERA_OPERATOR_ID!);
        this.operatorKey = operatorKey; // Use the one from config

        console.log('Environment variables:', {
            operatorId: process.env.HEDERA_OPERATOR_ID
        });
        
        // Set the client operator
        this.client.setOperator(this.operatorId, this.operatorKey);
    }

    // Add setters for treasury and token IDs
    public setTreasuryId(treasuryId: string) {
        this.treasuryId = AccountId.fromString(treasuryId);
    }

    public setTokenId(tokenId: string) {
        this.tokenId = TokenId.fromString(tokenId);
    }

    // Step 1: Just create the account
    async createAccount(publicKey: string) {
        try {
            const key = PublicKey.fromString(publicKey);

            // Create new account
            const accountTx = new AccountCreateTransaction()
                .setKey(key)
                .setInitialBalance(Hbar.fromTinybars(0))
                .setMaxAutomaticTokenAssociations(3); // For our 3 token types

            const accountResponse = await accountTx.execute(this.client);
            const accountReceipt = await accountResponse.getReceipt(this.client);
            const newAccountId = accountReceipt.accountId!;

            return {
                accountId: newAccountId.toString()
            };
        } catch (error) {
            console.error("Error in createAccount:", error);
            throw error;
        }
    }

    // Step 2: Generate unsigned token associate transaction
    async generateTokenAssociateTransaction(
        accountId: string,
        tokenIds: string[]
    ): Promise<Uint8Array> {
        try {
            const transaction = new TokenAssociateTransaction()
                .setAccountId(AccountId.fromString(accountId))
                .setTokenIds(tokenIds.map(id => TokenId.fromString(id)))
                .freezeWith(this.client);

            return transaction.toBytes();
        } catch (error) {
            console.error("Error generating token associate transaction:", error);
            throw error;
        }
    }

    // Step 3: Submit the signed transaction
    async submitSignedTransaction(signedTransaction: string): Promise<boolean> {
        try {
            // Decode base64 to buffer
            const buffer = Buffer.from(signedTransaction, 'base64');
            
            // Convert buffer to Transaction object
            const transaction = Transaction.fromBytes(buffer);
            
            // Submit to network
            const response = await transaction.execute(this.client);
            
            // Get the receipt
            const receipt = await response.getReceipt(this.client);
            
            return receipt.status === Status.Success;
        } catch (error) {
            console.error('Error submitting signed transaction:', error);
            throw error;
        }
    }

    async createNFTCollection(
        treasuryAccountId: string,
        name: string,
        symbol: string
    ): Promise<string> {
        try {
            const tx = new TokenCreateTransaction()
                .setTokenName(name)
                .setTokenSymbol(symbol)
                .setTokenType(TokenType.NonFungibleUnique)
                .setSupplyType(TokenSupplyType.Finite)
                .setMaxSupply(1000000)
                .setTreasuryAccountId(AccountId.fromString(treasuryAccountId))
                .setAdminKey(operatorPublicKey)
                .setSupplyKey(operatorPublicKey);

            const response = await tx.execute(this.client);
            const receipt = await response.getReceipt(this.client);
            
            return receipt.tokenId!.toString();
        } catch (error) {
            console.error("Error creating NFT collection:", error);
            throw error;
        }
    }

    async mintNFT(
        treasuryAccountId: string,
        tokenId: string,
        metadata: string[]
    ): Promise<{success: boolean; serialNumber?: number; transactionId?: string}> {
        try {
            const mintTx = new TokenMintTransaction()
                .setTokenId(TokenId.fromString(tokenId))
                .setMetadata(metadata.map(m => Buffer.from(m)))
                .freezeWith(this.client);

            const mintResponse = await (await mintTx.sign(this.operatorKey)).execute(this.client);
            const mintReceipt = await mintResponse.getReceipt(this.client);
            const serialNumber = mintReceipt.serials[0].low;

            return {
                success: true,
                serialNumber,
                transactionId: mintResponse.transactionId.toString()
            };
        } catch (error) {
            console.error('Mint NFT error:', error);
            return {
                success: false
            };
        }
    }

    async transferNFT(
        tokenId: string,
        serialNumber: number,
        toAccountId: string,
        fromAccountId: string
    ): Promise<{success: boolean; transactionId?: string}> {
        try {
            const transferTx = new TransferTransaction()
                .addNftTransfer(
                    TokenId.fromString(tokenId),
                    serialNumber,
                    AccountId.fromString(fromAccountId),
                    AccountId.fromString(toAccountId)
                )
                .freezeWith(this.client);

            const transferResponse = await (await transferTx.sign(this.operatorKey)).execute(this.client);
            await transferResponse.getReceipt(this.client);

            return {
                success: true,
                transactionId: transferResponse.transactionId.toString()
            };
        } catch (error) {
            console.error('Transfer NFT error:', error);
            return {
                success: false
            };
        }
    }

    async createNFTTransferTransaction(
        tokenId: string,
        serialNumber: number,
        fromAccountId: string,
        toAccountId: string
    ): Promise<Transaction> {
        const transaction = new TransferTransaction()
            .addNftTransfer(
                TokenId.fromString(tokenId),
                serialNumber,
                AccountId.fromString(fromAccountId),
                AccountId.fromString(toAccountId)
            )
            .freezeWith(this.client);

        return transaction;
    }
}

// Export a singleton instance
export const hederaService = new HederaService(); 