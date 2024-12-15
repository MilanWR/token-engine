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
    private treasuryId: string;
    private treasuryKey: PrivateKey;
    private readonly consentTokenId: string;
    private readonly dataCaptureTokenId: string;
    private readonly incentiveTokenId: string;
    private operatorKey: PrivateKey;
    private readonly mirrorNodeUrl: string;

    constructor(
        network: string = 'testnet',
        consentTokenId?: string,
        dataCaptureTokenId?: string,
        incentiveTokenId?: string
    ) {
        this.mirrorNodeUrl = `https://${network}.mirrornode.hedera.com`;
        this.consentTokenId = consentTokenId || process.env.CONSENT_TOKEN_ID || '';
        this.dataCaptureTokenId = dataCaptureTokenId || process.env.DATA_CAPTURE_TOKEN_ID || '';
        this.incentiveTokenId = incentiveTokenId || process.env.INCENTIVE_TOKEN_ID || '';

        // Initialize client
        this.client = Client.forTestnet();

        // Get operator from environment
        const operatorId = process.env.HEDERA_OPERATOR_ID;
        const operatorKey = process.env.HEDERA_OPERATOR_KEY;

        if (!operatorId || !operatorKey) {
            throw new Error('Environment variables OPERATOR_ID and OPERATOR_KEY must be present');
        }

        // Set the operator
        this.operatorKey = PrivateKey.fromString(operatorKey);
        this.treasuryId = operatorId;
        this.treasuryKey = this.operatorKey;  // Initially set to operator key
        this.client.setOperator(operatorId, this.operatorKey);

        console.log('HederaService initialized with operator:', operatorId);
    }

    // Initialize all token IDs
    async initialize(tokenIds: { 
        consentTokenId: string; 
        dataCaptureTokenId: string;
        incentiveTokenId: string;
        accountId: string;
    }) {
        this.consentTokenId = tokenIds.consentTokenId;
        this.dataCaptureTokenId = tokenIds.dataCaptureTokenId;
        this.incentiveTokenId = tokenIds.incentiveTokenId;
        this.treasuryId = tokenIds.accountId;
    }

    // Add setters for treasury and token IDs
    public setTreasuryId(treasuryId: string) {
        this.treasuryId = treasuryId;
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
        receiverAccountId: string,
        metadata: string,
        isConsent: boolean = true
    ): Promise<{ success: boolean; serialNumber?: number; transactionId?: string }> {
        try {
            const tokenId = isConsent ? this.consentTokenId : this.dataCaptureTokenId;
            if (!tokenId) {
                throw new Error(`${isConsent ? 'Consent' : 'Data Capture'} token ID not set`);
            }

            console.log('Minting NFT:', {
                tokenId,
                receiverAccountId,
                treasuryId: this.treasuryId,
                isConsent,
                metadata: metadata.substring(0, 50) + '...'
            });

            // First mint the NFT
            const mintTx = await new TokenMintTransaction()
                .setTokenId(tokenId)
                .setMetadata([Buffer.from(metadata)])
                .freezeWith(this.client);

            const signedTx = await mintTx.sign(this.operatorKey);
            const response = await signedTx.execute(this.client);
            const receipt = await response.getReceipt(this.client);

            // Get the serial number
            const serialNumber = receipt.serials.length > 0 ? receipt.serials[0].low : undefined;

            if (serialNumber === undefined) {
                throw new Error('Failed to get serial number');
            }

            // Only transfer if receiver is different from treasury
            if (receiverAccountId !== this.treasuryId) {
                console.log('Transferring NFT:', {
                    tokenId,
                    serialNumber,
                    from: this.treasuryId,
                    to: receiverAccountId,
                    isConsent
                });

                const transferTx = await new TransferTransaction()
                    .addNftTransfer(
                        tokenId,
                        serialNumber,
                        this.treasuryId,
                        receiverAccountId
                    )
                    .freezeWith(this.client);

                const signedTransferTx = await transferTx.sign(this.operatorKey);
                const transferResponse = await signedTransferTx.execute(this.client);
                await transferResponse.getReceipt(this.client);
            }

            return {
                success: true,
                serialNumber,
                transactionId: response.transactionId.toString()
            };
        } catch (error) {
            console.error(`${isConsent ? 'Consent' : 'Data Capture'} NFT error:`, error);
            throw error;
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

    async sendIncentiveTokens(
        receiverAccountId: string, 
        amount: number, 
        memo: string
    ): Promise<{ success: boolean; transactionId?: string }> {
        try {
            if (!this.incentiveTokenId) {
                throw new Error('Incentive token ID not set');
            }

            const tx = await new TransferTransaction()
                .addTokenTransfer(this.incentiveTokenId, this.treasuryId, -amount)
                .addTokenTransfer(this.incentiveTokenId, receiverAccountId, amount)
                .setTransactionMemo(memo)
                .freezeWith(this.client);

            const response = await (await tx.sign(this.operatorKey)).execute(this.client);
            const receipt = await response.getReceipt(this.client);
            
            return {
                success: receipt.status.toString() === 'SUCCESS',
                transactionId: response.transactionId.toString()
            };
        } catch (error) {
            console.error('Send incentive tokens error:', error);
            throw error;
        }
    }

    async createRedeemTokenTransaction(
        accountId: string,
        amount: number,
        memo: string
    ): Promise<Transaction> {
        const tx = await new TransferTransaction()
            .addTokenTransfer(this.incentiveTokenId, accountId, -amount)
            .addTokenTransfer(this.incentiveTokenId, this.treasuryId, amount)
            .setTransactionMemo(memo)
            .freezeWith(this.client);

        return tx;
    }

    setIncentiveTokenId(tokenId: string) {
        this.incentiveTokenId = tokenId;
    }

    getIncentiveTokenId(): string {
        return this.incentiveTokenId;
    }

   // Add this function to hederaService.ts:

async getTokenBalance(accountId: string, tokenId: string): Promise<number> {
    try {
        const response = await fetch(
            `${this.mirrorNodeUrl}/api/v1/accounts/${accountId}/tokens?token.id=${tokenId}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch token balance: ${response.statusText}`);
        }

        const data = await response.json();

        // Check if tokens array exists and has items
        if (data.tokens && data.tokens.length > 0) {
            // Find the balance for our specific token
            const tokenBalance = data.tokens[0].balance;
            return Number(tokenBalance);
        }

        // Return 0 if no balance found
        return 0;

    } catch (error) {
        console.error('Error getting token balance:', error);
        throw error;
    }
}
}

// Export a singleton instance
export const hederaService = new HederaService(); 