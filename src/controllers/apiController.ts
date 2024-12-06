import { Request, Response } from 'express';
import prisma from '../config/database';
import { CreateConsentRequest } from '../types/api';
import { hederaService } from '../services/hederaService';

// Add console.log to verify exports
console.log('Loading apiController...');

export {
    createUser,
    submitTokenAssociation,
    createConsent,
    createWithdrawConsentTransaction,
    submitWithdrawConsent
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

export const createConsent = async (req: Request, res: Response) => {
    try {
        const { accountId, uid, consentHash } = req.body as CreateConsentRequest;

        // Validate input
        if (!accountId || !consentHash) {
            return res.status(400).json({
                error: 'Missing required fields: accountId and consentHash are required'
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
        console.log('Using token IDs:', tokenIds);

        // Create NFT with consent hash as metadata
        const nftResponse = await hederaService.mintNFT(
            tokenIds.accountId,        // Treasury account
            tokenIds.consentTokenId,   // Token ID
            [consentHash]              // Metadata as array
        );

        if (!nftResponse.success) {
            throw new Error('Failed to mint NFT');
        }

        // Transfer NFT to user
        const transferResponse = await hederaService.transferNFT(
            tokenIds.consentTokenId,   // Token ID
            nftResponse.serialNumber!, // Serial number
            accountId,                 // To user
            tokenIds.accountId         // From treasury
        );

        if (!transferResponse.success) {
            throw new Error('Failed to transfer NFT');
        }

        // Store consent record
        const consent = await prisma.consent.create({
            data: {
                accountId,
                uid,
                consentHash,
                serialNumber: nftResponse.serialNumber!,
                tokenId: tokenIds.consentTokenId,
                mintTransactionId: nftResponse.transactionId!,
                transferTransactionId: transferResponse.transactionId!
            }
        });

        return res.status(201).json({
            success: true,
            serialNumber: nftResponse.serialNumber,
            transactionId: nftResponse.transactionId,
            consent
        });

    } catch (error) {
        console.error('Create consent error:', error);
        return res.status(500).json({
            error: 'Error creating consent',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

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

// Log the exports
console.log('Exports:', { createUser, submitTokenAssociation, createConsent, createWithdrawConsentTransaction, submitWithdrawConsent });
  