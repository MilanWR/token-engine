import { AccountCreateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType } from "@hashgraph/sdk";
import { client, operatorKey } from "../config/hedera";
import prisma from "../config/database";
import { generateApiKey } from "../utils/apiKey";

async function createMockAppOwner(email: string = 'mockapp@example.com') {
    try {
        // Check for existing user with this email
        const existingUser = await prisma.user.findUnique({
            where: { email },
            include: { tokenIds: true }
        });

        if (existingUser) {
            console.log(`Mock app owner with email ${email} already exists:`, {
                email: existingUser.email,
                apiKey: existingUser.apiKey,
                tokenIds: existingUser.tokenIds
            });
            return existingUser;
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

        // Create app owner in database with provided email
        console.log('\nCreating app owner in database...');
        const apiKey = generateApiKey();

        const appOwner = await prisma.user.create({
            data: {
                email,
                password: 'mock-password-123',
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

        console.log('\n=== Mock App Owner Created Successfully ===');
        console.log('\nApp Owner Details:');
        console.log('Email:', appOwner.email);
        console.log('API Key:', apiKey);
        console.log('\nHedera Details:');
        console.log('App Account ID:', appAccountId);
        console.log('Consent Token ID:', consentTokenId);
        console.log('Data Capture Token ID:', dataCaptureTokenId);
        console.log('Incentive Token ID:', incentiveTokenId);

        return appOwner;
    } catch (error) {
        console.error('Error creating mock app owner:', error);
        throw error;
    }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'mockapp@example.com';
createMockAppOwner(email);