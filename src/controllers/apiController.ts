import { Request, Response } from 'express';
import prisma from '../config/database';
import { CreateConsentRequest } from '../types/api';
import { hederaService } from '../services/hederaService';
import { mirrorNodeService } from '../services/mirrorNodeService';

// Add console.log to verify exports
console.log('Loading apiController...');

/**
 * @swagger
 * tags:
 *   - name: Consent
 *     description: Consent NFT management
 *   - name: Data Capture
 *     description: Data capture NFT operations
 *   - name: Incentive
 *     description: Incentive token management
 *   - name: User
 *     description: User account management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ConsentRequest:
 *       type: object
 *       required:
 *         - accountId
 *         - consentHash
 *         - categoryId
 *       properties:
 *         accountId:
 *           type: string
 *           example: "0.0.123456"
 *         consentHash:
 *           type: string
 *           example: "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt"
 *         categoryId:
 *           type: integer
 *           example: 1
 *         incentiveAmount:
 *           type: number
 *           example: 10
 *         uid:
 *           type: string
 *           example: "optional-user-id"
 *     
 *     DataCaptureRequest:
 *       type: object
 *       required:
 *         - accountId
 *         - dataHash
 *         - categoryId
 *       properties:
 *         accountId:
 *           type: string
 *           example: "0.0.123456"
 *         dataHash:
 *           type: string
 *           example: "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt"
 *         categoryId:
 *           type: integer
 *           example: 1
 *         incentiveAmount:
 *           type: number
 *           example: 5
 *         uid:
 *           type: string
 *           example: "optional-user-id"
 */

export {
    createUser,
    submitTokenAssociation,
    createConsent,
    createWithdrawConsentTransaction,
    submitWithdrawConsent,
    createDataCapture,
    verifyDataCapture,
    listDataCaptures,
    getConsentStatus,
    listActiveConsents,
    listWithdrawnConsents,
    getConsentHistory,
    sendIncentiveTokens,
    createRedeemTokenTransaction,
    submitRedeemTransaction
};

export const createUser = async (req: Request, res: Response) => {
    try {
        console.log('createUser called');
        const { publicKey, uid } = req.body as CreateUserRequest;

        // Validate public key
        if (!publicKey) {
            return res.status(400).json({ 
                error: 'Public key is required' 
            });
        }

        // Validate public key format
        if (!(publicKey.length === 64 || 
            (publicKey.length === 88 && publicKey.startsWith("302a300506032b6570")))) {
            return res.status(400).json({ 
                error: 'Invalid public key format. Must be either 64-character hex or DER encoded ED25519 public key' 
            });
        }

        // Get the app owner's token IDs
        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        console.log('Found app owner:', {
            id: appOwner?.id,
            email: appOwner?.email,
            apiKey: appOwner?.apiKey,
            tokenIds: appOwner?.tokenIds
        });

        if (!appOwner?.tokenIds?.[0]) {
            throw new Error('Token IDs not found for app owner');
        }

        const tokenIds = appOwner.tokenIds[0]; // Get the first (and only) tokenIds record

        console.log('App Owner Token IDs:', {
            consentTokenId: tokenIds.consentTokenId,
            dataCaptureTokenId: tokenIds.dataCaptureTokenId,
            incentiveTokenId: tokenIds.incentiveTokenId
        });

        // Create Hedera account
        const accountResponse = await hederaService.createAccount(publicKey);
        
        try {
            // Validate token IDs before using them
            if (!tokenIds.consentTokenId || 
                !tokenIds.dataCaptureTokenId || 
                !tokenIds.incentiveTokenId) {
                throw new Error('One or more token IDs are missing');
            }

            // Generate token associate transaction
            const tokenIdsArray = [
                tokenIds.consentTokenId,
                tokenIds.dataCaptureTokenId,
                tokenIds.incentiveTokenId
            ];

            console.log('Token IDs for association:', tokenIdsArray);

            const unsignedTransaction = await hederaService.generateTokenAssociateTransaction(
                accountResponse.accountId,
                tokenIdsArray
            );

            // Return the response with transaction
            return res.status(201).json({
                publicKey,
                accountId: accountResponse.accountId,
                unsignedTokenAssociateTransaction: Buffer.from(unsignedTransaction).toString('base64'),
                ...(uid && { uid })
            });
        } catch (tokenError) {
            console.error('Token association generation error:', tokenError);
            
            // Return just the account creation response if token association fails
            return res.status(201).json({
                publicKey,
                accountId: accountResponse.accountId,
                ...(uid && { uid })
            });
        }
    } catch (error) {
        console.error('Hedera account creation error:', error);
        
        // Fall back to mock account ID if in development
        if (process.env.NODE_ENV === 'development') {
            const mockAccountId = `0.0.${Math.floor(Math.random() * 1000000)}`;
            return res.status(201).json({
                publicKey: req.body.publicKey,
                accountId: mockAccountId,
                ...(uid && { uid })
            });
        }
        
        return res.status(500).json({
            error: 'Error creating Hedera account',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const submitTokenAssociation = async (req: Request, res: Response) => {
    try {
        const { signedTransaction } = req.body;

        if (!signedTransaction) {
            return res.status(400).json({
                error: 'Signed transaction is required'
            });
        }

        const success = await hederaService.submitSignedTransaction(
            Buffer.from(signedTransaction, 'base64')
        );

        return res.status(200).json({
            success,
            message: success ? 'Token association successful' : 'Token association failed'
        });
    } catch (error) {
        console.error('Submit token association error:', error);
        return res.status(500).json({
            error: 'Error submitting token association',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/consent:
 *   post:
 *     summary: Create a new consent NFT
 *     tags: [Consent]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsentRequest'
 *     responses:
 *       201:
 *         description: Consent NFT created successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Invalid API key
 */

export const createConsent = async (req: Request, res: Response) => {
    try {
        const { accountId, consentHash, categoryId, incentiveAmount, uid } = req.body;

        if (!accountId || !consentHash || !categoryId) {
            return res.status(400).json({
                error: 'Missing required fields: accountId, consentHash, and categoryId are required'
            });
        }

        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        if (!appOwner?.tokenIds[0]) {
            return res.status(404).json({ error: 'Token IDs not found' });
        }

        // Initialize HederaService with all token IDs
        await hederaService.initialize({
            consentTokenId: appOwner.tokenIds[0].consentTokenId,
            dataCaptureTokenId: appOwner.tokenIds[0].dataCaptureTokenId,
            incentiveTokenId: appOwner.tokenIds[0].incentiveTokenId,
            accountId: appOwner.tokenIds[0].accountId
        });

        const nftResponse = await hederaService.mintNFT(accountId, consentHash, true);
        
        if (!nftResponse.success) {
            throw new Error('Failed to mint NFT');
        }

        // Add incentive reward if specified
        if (incentiveAmount) {
            await hederaService.sendIncentiveTokens(
                accountId,
                incentiveAmount,
                `consent_reward_${nftResponse.transactionId}`
            );
        }

        // Create response object without optional fields
        const response = {
            success: true,
            serialNumber: nftResponse.serialNumber,
            transactionId: nftResponse.transactionId,
            accountId,
            consentHash,
            categoryId
        };

        // Add optional fields if they exist
        if (incentiveAmount !== undefined) {
            Object.assign(response, { incentiveAmount });
        }
        
        if (uid !== undefined) {
            Object.assign(response, { uid });
        }

        return res.status(201).json(response);

    } catch (error) {
        console.error('Create consent error:', error);
        return res.status(500).json({
            error: 'Error creating consent',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/consent/active:
 *   get:
 *     summary: List all active consents
 *     tags: [Consent]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of active consents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 consents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       serialNumber:
 *                         type: integer
 *                       accountId:
 *                         type: string
 *                       categoryId:
 *                         type: integer
 *                       hash:
 *                         type: string
 *                       timestamp:
 *                         type: string
 */

export const createWithdrawConsentTransaction = async (req: Request, res: Response) => {
    try {
        const { accountId, uid, serialNumber, consentHash } = req.body as WithdrawConsentRequest;

        // Validate input
        if (!accountId || !serialNumber || !consentHash) {
            return res.status(400).json({
                error: 'Missing required fields: accountId, serialNumber, and consentHash are required'
            });
        }

        // Get the app owner's token IDs
        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        if (!appOwner?.tokenIds?.[0]) {
            return res.status(404).json({
                error: 'Token IDs not found for app owner'
            });
        }

        const tokenIds = appOwner.tokenIds[0];

        // Create unsigned NFT transfer transaction
        const unsignedTx = await hederaService.createNFTTransferTransaction(
            tokenIds.consentTokenId,   // Token ID
            serialNumber,              // Serial number to transfer
            accountId,                 // From user's account
            tokenIds.accountId         // To treasury account
        );

        // Convert transaction to bytes and base64 encode
        const txBytes = unsignedTx.toBytes();
        const unsignedWithdrawTransaction = Buffer.from(txBytes).toString('base64');

        return res.status(200).json({
            unsignedWithdrawTransaction,
            accountId,
            uid,
            consentHash
        });

    } catch (error) {
        console.error('Create withdraw consent transaction error:', error);
        return res.status(500).json({
            error: 'Error creating withdraw consent transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const submitWithdrawConsent = async (req: Request, res: Response) => {
    try {
        const { signedTransaction, accountId, uid } = req.body;

        // Get app owner details from database using API key
        const appOwner = await prisma.user.findUnique({
            where: { 
                apiKey: req.headers['x-api-key'] as string 
            },
            include: {
                tokenIds: true
            }
        });

        if (!appOwner) {
            return res.status(404).json({
                error: 'App owner not found'
            });
        }

        // Set the treasury and token IDs for this operation
        hederaService.setTreasuryId(appOwner.tokenIds[0].accountId);
        hederaService.setTokenId(appOwner.tokenIds[0].consentTokenId);

        // Continue with transaction submission
        const success = await hederaService.submitSignedTransaction(signedTransaction);

        if (success) {
            // Update consent record status
            await prisma.consent.updateMany({
                where: {
                    accountId,
                    uid,
                    withdrawnAt: null,
                    userId: appOwner.id  // Add this to ensure we only update this owner's consents
                },
                data: {
                    withdrawnAt: new Date()
                }
            });
        }

        return res.json({
            success,
            message: success ? 'Consent withdrawn successfully' : 'Failed to withdraw consent'
        });
    } catch (error) {
        console.error('Submit withdraw consent error:', error);
        return res.status(500).json({
            error: 'Error submitting withdraw consent',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// check consent using mirror node
async function verifyConsentWithMirrorNode(accountId: string, consentTokenId: string, categoryId: number): Promise<boolean> {
    try {
        // Get all NFTs for this account and token
        const response = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/tokens/${consentTokenId}/nfts?account.id=${accountId}`
        );
        const data = await response.json();
        
        // Check each NFT's metadata for matching categoryId
        return data.nfts.some((nft: any) => {
            try {
                // Decode base64 metadata
                const metadataBase64 = nft.metadata;
                const metadataBuffer = Buffer.from(metadataBase64, 'base64');
                const metadata = metadataBuffer.toString('utf8');
                console.log('Decoded metadata:', metadata); // For debugging
                
                const [nftCategoryId] = metadata.split(':');
                return parseInt(nftCategoryId) === categoryId;
            } catch (error) {
                console.error('Error processing NFT metadata:', error);
                return false;
            }
        });
    } catch (error) {
        console.error('Mirror node verification error:', error);
        return false;
    }
}

/**
 * @swagger
 * /api/v1/data-capture:
 *   post:
 *     summary: Create a new data capture NFT
 *     tags: [Data Capture]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DataCaptureRequest'
 *     responses:
 *       201:
 *         description: Data capture NFT created successfully
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Invalid API key
 *       404:
 *         description: No valid consent found
 */

// createDataCapture function
export const createDataCapture = async (req: Request, res: Response) => {
    try {
        const { accountId, dataHash, categoryId, incentiveAmount, uid } = req.body;

        if (!accountId || !dataHash || !categoryId) {
            return res.status(400).json({
                error: 'Missing required fields: accountId, dataHash, and categoryId are required'
            });
        }

        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        if (!appOwner?.tokenIds[0]) {
            return res.status(404).json({ error: 'Token IDs not found' });
        }

        // Initialize HederaService with all token IDs
        await hederaService.initialize({
            consentTokenId: appOwner.tokenIds[0].consentTokenId,
            dataCaptureTokenId: appOwner.tokenIds[0].dataCaptureTokenId,
            incentiveTokenId: appOwner.tokenIds[0].incentiveTokenId,
            accountId: appOwner.tokenIds[0].accountId
        });

        console.log('Creating data capture with:', {
            accountId,
            dataHash,
            categoryId,
            incentiveAmount,
            dataCaptureTokenId: appOwner.tokenIds[0].dataCaptureTokenId
        });

        const nftResponse = await hederaService.mintNFT(accountId, dataHash, false);
        
        if (!nftResponse.success) {
            throw new Error('Failed to mint data capture NFT');
        }

        // Add incentive reward if specified
        if (incentiveAmount) {
            await hederaService.sendIncentiveTokens(
                accountId,
                incentiveAmount,
                `data_capture_reward_${nftResponse.transactionId}`
            );
        }

        // Create response object without optional fields
        const response = {
            success: true,
            serialNumber: nftResponse.serialNumber,
            transactionId: nftResponse.transactionId,
            accountId,
            dataHash,
            categoryId
        };

        // Add optional fields if they exist
        if (incentiveAmount !== undefined) {
            Object.assign(response, { incentiveAmount });
        }
        
        if (uid !== undefined) {
            Object.assign(response, { uid });
        }

        return res.status(201).json(response);

    } catch (error) {
        console.error('Create data capture error:', error);
        return res.status(500).json({
            error: 'Error creating data capture',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const verifyDataCapture = async (req: Request, res: Response) => {
    try {
        const { accountId, serialNumber } = req.params;

        const dataCapture = await prisma.dataCapture.findFirst({
            where: {
                accountId,
                serialNumber: parseInt(serialNumber)
            }
        });

        if (!dataCapture) {
            return res.status(404).json({
                success: false,
                error: 'Data capture not found'
            });
        }

        return res.status(200).json({
            success: true,
            dataCapture
        });

    } catch (error) {
        console.error('Verify data capture error:', error);
        return res.status(500).json({
            error: 'Error verifying data capture',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/data-capture/list:
 *   get:
 *     summary: List data captures
 *     tags: [Data Capture]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         required: true
 *         description: Hedera account ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: List of data captures
 */

export const listDataCaptures = async (req: Request, res: Response) => {
    try {
        const { accountId, categoryId } = req.query;
        
        const where: any = { accountId: accountId as string };
        if (categoryId) {
            where.categoryId = parseInt(categoryId as string);
        }

        const dataCaptures = await prisma.dataCapture.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            dataCaptures
        });

    } catch (error) {
        console.error('List data captures error:', error);
        return res.status(500).json({
            error: 'Error listing data captures',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// New endpoints for data capture and consent management

/**
 * @swagger
 * /api/v1/consent/{tokenId}/{serialNumber}/status:
 *   get:
 *     summary: Get consent NFT status
 *     tags: [Consent]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent token ID
 *       - in: path
 *         name: serialNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: NFT serial number
 *     responses:
 *       200:
 *         description: Consent status details
 */

export const getConsentStatus = async (req: Request, res: Response) => {
    try {
        const { tokenId, serialNumber } = req.params;
        const status = await mirrorNodeService.getConsentStatus(tokenId, parseInt(serialNumber));
        return res.json(status);
    } catch (error) {
        return res.status(500).json({
            error: 'Error getting consent status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/consent/{tokenId}/{serialNumber}/history:
 *   get:
 *     summary: Get consent NFT history
 *     tags: [Consent]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Consent token ID
 *       - in: path
 *         name: serialNumber
 *         required: true
 *         schema:
 *           type: integer
 *         description: NFT serial number
 *     responses:
 *       200:
 *         description: Complete consent history
 */

export const listActiveConsents = async (req: Request, res: Response) => {
    try {
        const { accountId } = req.query;
        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        const tokenId = appOwner?.tokenIds[0].consentTokenId;
        if (!tokenId) throw new Error('Token ID not found');

        const nfts = accountId 
            ? await mirrorNodeService.getAccountNFTs(tokenId, accountId as string)
            : (await mirrorNodeService.getAllNFTs(tokenId)).nfts as NFTInfo[];

        const consents = nfts.map(nft => ({
            serialNumber: nft.serial_number,
            accountId: nft.account_id,
            ...mirrorNodeService.decodeMetadata(nft.metadata),
            timestamp: nft.created_timestamp
        }));

        return res.json({ consents });
    } catch (error) {
        return res.status(500).json({
            error: 'Error listing consents',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const listWithdrawnConsents = async (req: Request, res: Response) => {
    try {
        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        if (!appOwner?.tokenIds[0]) throw new Error('Token IDs not found');

        const withdrawnNFTs = await mirrorNodeService.getWithdrawnConsents(
            appOwner.tokenIds[0].consentTokenId,
            appOwner.tokenIds[0].accountId
        );

        const withdrawnConsents = withdrawnNFTs.map(nft => ({
            serialNumber: nft.serial_number,
            ...mirrorNodeService.decodeMetadata(nft.metadata),
            timestamp: nft.created_timestamp
        }));

        return res.json({ withdrawnConsents });
    } catch (error) {
        return res.status(500).json({
            error: 'Error listing withdrawn consents',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

export const getConsentHistory = async (req: Request, res: Response) => {
    try {
        const { tokenId, serialNumber } = req.params;
        const history = await mirrorNodeService.getNFTHistory(tokenId, parseInt(serialNumber));
        
        // Get the app owner's treasury account ID for comparison
        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });
        const treasuryId = appOwner?.tokenIds[0].accountId;

        // Sort history by timestamp (oldest first)
        const sortedHistory = history.sort((a, b) => 
            Number(a.consensus_timestamp) - Number(b.consensus_timestamp)
        );

        // Find key events
        const mintEvent = sortedHistory.find(tx => tx.sender_account_id === null);
        const latestEvent = sortedHistory[sortedHistory.length - 1];
        
        // Determine consent status
        const isWithdrawn = latestEvent?.receiver_account_id === treasuryId;
        
        // Format the response
        const response = {
            serialNumber: parseInt(serialNumber),
            status: isWithdrawn ? 'withdrawn' : 'active',
            consentGranted: {
                timestamp: new Date(Number(mintEvent?.consensus_timestamp.split('.')[0]) * 1000).toISOString(),
                transactionId: mintEvent?.transaction_id,
                grantedTo: sortedHistory.find(tx => tx.sender_account_id === treasuryId)?.receiver_account_id
            },
            consentWithdrawn: isWithdrawn ? {
                timestamp: new Date(Number(latestEvent.consensus_timestamp.split('.')[0]) * 1000).toISOString(),
                transactionId: latestEvent.transaction_id
            } : null,
            detailedHistory: sortedHistory.map(tx => ({
                timestamp: new Date(Number(tx.consensus_timestamp.split('.')[0]) * 1000).toISOString(),
                action: tx.sender_account_id === null ? 'MINT' : 
                       tx.receiver_account_id === treasuryId ? 'WITHDRAW' : 'TRANSFER',
                from: tx.sender_account_id || 'TREASURY',
                to: tx.receiver_account_id,
                transactionId: tx.transaction_id
            }))
        };

        return res.json(response);
    } catch (error) {
        return res.status(500).json({
            error: 'Error getting consent history',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/incentive/send:
 *   post:
 *     summary: Send incentive tokens to a user's account
 *     tags: [Incentive]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: Hedera account ID
 *                 example: "0.0.123456"
 *               amount:
 *                 type: number
 *                 description: Amount of tokens to send
 *                 example: 100
 *               memo:
 *                 type: string
 *                 description: Optional memo for the transaction
 *                 example: "Reward for consent"
 *     responses:
 *       200:
 *         description: Tokens sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: string
 *                   example: "0.0.123@1234567890.000"
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Invalid API key
 *       500:
 *         description: Server error
 */
export const sendIncentiveTokens = async (req: Request, res: Response) => {
    try {
        const { accountId, amount, memo } = req.body;

        if (!accountId || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: accountId and amount are required'
            });
        }

        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        if (!appOwner?.tokenIds[0]) {
            return res.status(404).json({ error: 'Token IDs not found' });
        }

        // Initialize HederaService with all token IDs
        await hederaService.initialize({
            consentTokenId: appOwner.tokenIds[0].consentTokenId,
            dataCaptureTokenId: appOwner.tokenIds[0].dataCaptureTokenId,
            incentiveTokenId: appOwner.tokenIds[0].incentiveTokenId,
            accountId: appOwner.tokenIds[0].accountId
        });

        const result = await hederaService.sendIncentiveTokens(
            accountId,
            amount,
            memo || `reward_${Date.now()}`
        );

        return res.json(result);
    } catch (error) {
        console.error('Controller error:', error);
        return res.status(500).json({
            error: 'Error sending incentive tokens',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/incentive/redeem:
 *   post:
 *     summary: Create an unsigned transaction for redeeming tokens
 *     tags: [Incentive]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - amount
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: Hedera account ID
 *                 example: "0.0.123456"
 *               amount:
 *                 type: number
 *                 description: Amount of tokens to redeem
 *                 example: 50
 *               memo:
 *                 type: string
 *                 description: Optional memo for the transaction
 *                 example: "Token redemption"
 *     responses:
 *       200:
 *         description: Unsigned transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unsignedRedeemTransaction:
 *                   type: string
 *                   description: Base64 encoded unsigned transaction
 *                 accountId:
 *                   type: string
 *                   example: "0.0.123456"
 *                 amount:
 *                   type: number
 *                   example: 50
 *                 memo:
 *                   type: string
 *                   example: "Token redemption"
 */
export const createRedeemTokenTransaction = async (req: Request, res: Response) => {
    try {
        const { accountId, amount, memo } = req.body;

        if (!accountId || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: accountId and amount are required'
            });
        }

        const appOwner = await prisma.user.findUnique({
            where: { apiKey: req.headers['x-api-key'] as string },
            include: { tokenIds: true }
        });

        if (!appOwner?.tokenIds[0]) {
            return res.status(404).json({ error: 'Token IDs not found' });
        }

        hederaService.setIncentiveTokenId(appOwner.tokenIds[0].incentiveTokenId);
        const unsignedTx = await hederaService.createRedeemTokenTransaction(
            accountId,
            amount,
            memo || `redeem_${Date.now()}`
        );

        const txBytes = unsignedTx.toBytes();
        const unsignedRedeemTransaction = Buffer.from(txBytes).toString('base64');

        return res.json({
            unsignedRedeemTransaction,
            accountId,
            amount,
            memo
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Error creating redeem transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/v1/incentive/redeem/submit:
 *   post:
 *     summary: Submit a signed redeem transaction
 *     tags: [Incentive]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountId
 *               - signedTransaction
 *             properties:
 *               accountId:
 *                 type: string
 *                 description: Hedera account ID
 *                 example: "0.0.123456"
 *               signedTransaction:
 *                 type: string
 *                 description: Base64 encoded signed transaction
 *     responses:
 *       200:
 *         description: Transaction submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactionId:
 *                   type: string
 *                   example: "0.0.123@1234567890.000"
 */
export const submitRedeemTransaction = async (req: Request, res: Response) => {
    try {
        const { signedTransaction, accountId } = req.body;

        if (!signedTransaction || !accountId) {
            return res.status(400).json({
                error: 'Missing required fields: signedTransaction and accountId are required'
            });
        }

        const success = await hederaService.submitSignedTransaction(
            Buffer.from(signedTransaction, 'base64')
        );

        return res.json({
            success,
            message: success ? 'Tokens redeemed successfully' : 'Token redemption failed'
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Error submitting redeem transaction',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Log the exports
console.log('Exports:', { createUser, submitTokenAssociation, createConsent, createWithdrawConsentTransaction, submitWithdrawConsent, createDataCapture, verifyDataCapture, listDataCaptures, getConsentStatus, listActiveConsents, listWithdrawnConsents, getConsentHistory, sendIncentiveTokens, createRedeemTokenTransaction, submitRedeemTransaction });
  