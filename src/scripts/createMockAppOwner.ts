import prisma from '../config/database';
import { HederaService } from '../services/hederaService';
import { generateApiKey } from '../utils/apiKey';
import bcrypt from 'bcryptjs';

async function createMockAppOwner() {
    try {
        // 1. Create app owner account in our database
        const hashedPassword = await bcrypt.hash('password123', 10);
        const apiKey = generateApiKey();

        const appOwner = await prisma.user.create({
            data: {
                email: 'mockapp@example.com',
                password: hashedPassword,
                apiKey: apiKey,
                firstName: 'Mock',
                lastName: 'App'
            }
        });

        console.log('Created app owner:', appOwner);

        // 2. Create three token collections for the app owner
        const consentTokenId = await HederaService.createNFTCollection(
            process.env.HEDERA_OPERATOR_ID!,  // Using operator as treasury
            'Consent Tokens',
            'CNST'
        );

        const dataCaptureTokenId = await HederaService.createNFTCollection(
            process.env.HEDERA_OPERATOR_ID!,
            'Data Capture Tokens',
            'DATA'
        );

        const incentiveTokenId = await HederaService.createNFTCollection(
            process.env.HEDERA_OPERATOR_ID!,
            'Incentive Tokens',
            'INCN'
        );

        // 3. Store token IDs in database
        const tokenIds = await prisma.tokenIds.create({
            data: {
                userId: appOwner.id,
                consentTokenId,
                dataCaptureTokenId,
                incentiveTokenId
            }
        });

        console.log('Created token collections:', tokenIds);
        console.log('\nUse these credentials for testing:');
        console.log('API Key:', apiKey);
        console.log('Consent Token ID:', consentTokenId);
        console.log('Data Capture Token ID:', dataCaptureTokenId);
        console.log('Incentive Token ID:', incentiveTokenId);

    } catch (error) {
        console.error('Error creating mock app owner:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
createMockAppOwner(); 