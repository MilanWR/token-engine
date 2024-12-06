import { AccountCreateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";
import { client, operatorKey } from "../config/hedera";
import prisma from "../config/database";
import { generateApiKey } from "../utils/apiKey";

async function createMockAppOwner() {
    try {
        // Clean up existing data
        const existingUser = await prisma.user.findUnique({
            where: { email: 'mockapp@example.com' }
        });

        if (existingUser) {
            console.log('Cleaning up existing user...');
            await prisma.tokenIds.deleteMany({ where: { userId: existingUser.id } });
            await prisma.user.delete({ where: { id: existingUser.id } });
        }

        // Create a new Hedera account for the app's tokens
        console.log('Creating Hedera account...');
        const createAccountTx = new AccountCreateTransaction()
            .setKey(operatorKey.publicKey)
            .setInitialBalance(10)
            .freezeWith(client);

        const createAccountResponse = await (await createAccountTx.sign(operatorKey)).execute(client);
        const accountReceipt = await createAccountResponse.getReceipt(client);
        const appAccountId = accountReceipt.accountId!.toString();
        console.log('Created Hedera account:', appAccountId);

        // Create tokens
        console.log('\nCreating tokens...');
        
        // 1. Consent Token
        console.log('Creating Consent Token...');
        const consentTokenTx = new TokenCreateTransaction()
            .setTokenName("Consent Token")
            .setTokenSymbol("CONSENT")
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyType(TokenSupplyType.Infinite)
            .setTreasuryAccountId(appAccountId)
            .setAdminKey(operatorKey.publicKey)
            .setSupplyKey(operatorKey.publicKey)
            .freezeWith(client);

        const consentTokenResponse = await (await consentTokenTx.sign(operatorKey)).execute(client);
        const consentTokenId = (await consentTokenResponse.getReceipt(client)).tokenId!.toString();
        console.log('Consent Token ID:', consentTokenId);

        // 2. Data Capture Token
        console.log('Creating Data Capture Token...');
        const dataCaptureTokenTx = new TokenCreateTransaction()
            .setTokenName("Data Capture Token")
            .setTokenSymbol("DATA")
            .setTokenType(TokenType.NonFungibleUnique)
            .setSupplyType(TokenSupplyType.Infinite)
            .setTreasuryAccountId(appAccountId)
            .setAdminKey(operatorKey.publicKey)
            .setSupplyKey(operatorKey.publicKey)
            .freezeWith(client);

        const dataCaptureTokenResponse = await (await dataCaptureTokenTx.sign(operatorKey)).execute(client);
        const dataCaptureTokenId = (await dataCaptureTokenResponse.getReceipt(client)).tokenId!.toString();
        console.log('Data Capture Token ID:', dataCaptureTokenId);

        // 3. Incentive Token
        console.log('Creating Incentive Token...');
        const incentiveTokenTx = new TokenCreateTransaction()
            .setTokenName("Incentive Token")
            .setTokenSymbol("REWARD")
            .setTokenType(TokenType.FungibleCommon)
            .setDecimals(2)
            .setInitialSupply(1000000)
            .setTreasuryAccountId(appAccountId)
            .setAdminKey(operatorKey.publicKey)
            .setSupplyKey(operatorKey.publicKey)
            .freezeWith(client);

        const incentiveTokenResponse = await (await incentiveTokenTx.sign(operatorKey)).execute(client);
        const incentiveTokenId = (await incentiveTokenResponse.getReceipt(client)).tokenId!.toString();
        console.log('Incentive Token ID:', incentiveTokenId);

        // Create app owner in database
        console.log('\nCreating app owner in database...');
        const apiKey = generateApiKey();

        console.log('Creating user with token IDs:', {
            consentTokenId,
            dataCaptureTokenId,
            incentiveTokenId
        });

        const appOwner = await prisma.user.create({
            data: {
                email: 'mockapp@example.com',
                password: 'mock-password-123', // Add password field
                firstName: 'Mock',
                lastName: 'App',
                apiKey: apiKey,
                tokenIds: {
                    create: {
                        accountId: appAccountId,
                        consentTokenId,
                        dataCaptureTokenId,
                        incentiveTokenId
                    }
                }
            },
            include: {
                tokenIds: true
            }
        });

        console.log('Created app owner with token IDs:', appOwner.tokenIds);

        console.log('\n=== Mock App Owner Created Successfully ===');
        console.log('\nApp Owner Details:');
        console.log('Email:', appOwner.email);
        console.log('API Key:', apiKey);
        console.log('\nHedera Details:');
        console.log('App Account ID:', appAccountId);
        console.log('Consent Token ID:', consentTokenId);
        console.log('Data Capture Token ID:', dataCaptureTokenId);
        console.log('Incentive Token ID:', incentiveTokenId);
        console.log('\nNote: The app account uses the operator\'s private key for backend control');

    } catch (error) {
        console.error('Error creating mock app owner:', error);
        throw error;
    }
}

createMockAppOwner();