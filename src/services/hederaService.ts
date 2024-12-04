import { 
    AccountCreateTransaction,
    TokenAssociateTransaction,
    TokenMintTransaction,
    PublicKey,
    AccountId,
    TokenId,
    Hbar,
    Transaction,
    TransactionResponse,
    TokenCreateTransaction,
    TokenSupplyType,
    TokenType
} from "@hashgraph/sdk";
import { client, operatorPublicKey } from "../config/hedera";

export class HederaService {
    // Step 1: Just create the account
    static async createAccount(
        publicKey: string
    ): Promise<string> {
        try {
            const key = PublicKey.fromString(publicKey);

            // Create new account
            const accountTx = new AccountCreateTransaction()
                .setKey(key)
                .setInitialBalance(Hbar.fromTinybars(0))
                .setMaxAutomaticTokenAssociations(3); // For our 3 token types

            const accountResponse = await accountTx.execute(client);
            const accountReceipt = await accountResponse.getReceipt(client);
            const newAccountId = accountReceipt.accountId!;

            return newAccountId.toString();
        } catch (error) {
            console.error("Error in createAccount:", error);
            throw error;
        }
    }

    // Step 2: Generate unsigned token associate transaction
    static async generateTokenAssociateTransaction(
        accountId: string,
        tokenIds: string[]
    ): Promise<Uint8Array> {
        try {
            const transaction = new TokenAssociateTransaction()
                .setAccountId(AccountId.fromString(accountId))
                .setTokenIds(tokenIds.map(id => TokenId.fromString(id)))
                .freezeWith(client);

            // Get the unsigned transaction bytes
            const transactionBytes = transaction.toBytes();
            return transactionBytes;
        } catch (error) {
            console.error("Error generating token associate transaction:", error);
            throw error;
        }
    }

    // Step 3: Submit the signed transaction
    static async submitSignedTransaction(
        signedTransaction: Uint8Array
    ): Promise<boolean> {
        try {
            // Convert bytes back to transaction and execute
            const transaction = Transaction.fromBytes(signedTransaction);
            const response = await transaction.execute(client);
            const receipt = await response.getReceipt(client);

            return receipt.status._code === 22; // SUCCESS
        } catch (error) {
            console.error("Error submitting signed transaction:", error);
            throw error;
        }
    }

    static async createNFTCollection(
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

            const response = await tx.execute(client);
            const receipt = await response.getReceipt(client);
            
            return receipt.tokenId!.toString();
        } catch (error) {
            console.error("Error creating NFT collection:", error);
            throw error;
        }
    }

    // ... rest of the methods remain the same ...
} 