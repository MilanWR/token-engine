import { Request, Response } from 'express';
import { CreateUserRequest, CreateUserResponse } from '../types/api';
import { HederaService } from '../services/hederaService';
import prisma from '../config/database';

export const analyzeSentiment = async (req: Request, res: Response) => {
  try {
    console.log('Analyzing sentiment for request:', req.body);
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple mock sentiment analysis
    const words = text.toLowerCase().split(' ');
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'horrible'];

    let score = 0;
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';

    res.json({
      sentiment,
      score,
      text,
      wordCount: words.length
    });
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    res.status(500).json({ error: 'Error analyzing sentiment' });
  }
};

export const countWords = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const words = text.trim().split(/\s+/);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));

    res.json({
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      text
    });
  } catch (error) {
    res.status(500).json({ error: 'Error counting words' });
  }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { publicKey, uid } = req.body as CreateUserRequest;

        // Validate public key
        if (!publicKey) {
            return res.status(400).json({ 
                error: 'Public key is required' 
            });
        }

        // Validate public key format
        // Accept both raw hex (64 chars) and DER encoded (starts with "302a300506032b6570")
        if (!(publicKey.length === 64 || 
            (publicKey.length === 88 && publicKey.startsWith("302a300506032b6570")))) {
            return res.status(400).json({ 
                error: 'Invalid public key format. Must be either 64-character hex or DER encoded ED25519 public key' 
            });
        }

        try {
            // Step 1: Create the account
            const accountId = await HederaService.createAccount(publicKey);

            // Get the app owner's token IDs
            const appOwner = await prisma.user.findUnique({
                where: { apiKey: req.headers['x-api-key'] as string },
                include: { tokenIds: true }
            });

            if (!appOwner?.tokenIds) {
                throw new Error('Token IDs not found for app owner');
            }

            // Step 2: Generate unsigned token associate transaction
            const tokenIds = [
                appOwner.tokenIds.consentTokenId,
                appOwner.tokenIds.dataCaptureTokenId,
                appOwner.tokenIds.incentiveTokenId
            ];

            const unsignedTransaction = await HederaService.generateTokenAssociateTransaction(
                accountId,
                tokenIds
            );

            const response: CreateUserResponse = {
                publicKey,
                accountId,
                unsignedTokenAssociateTransaction: Buffer.from(unsignedTransaction).toString('base64'),
                ...(uid && { uid })
            };

            res.status(201).json(response);
        } catch (error: any) {
            console.error('Hedera account creation error:', error);
            
            // Fall back to mock account ID if Hedera service fails (for development)
            if (process.env.NODE_ENV === 'development') {
                const mockAccountId = `0.0.${Math.floor(Math.random() * 1000000)}`;
                const response: CreateUserResponse = {
                    publicKey,
                    accountId: mockAccountId,
                };
                if (uid) {
                    response.uid = uid;
                }
                res.status(201).json(response);
            } else {
                res.status(500).json({ 
                    error: 'Failed to create Hedera account',
                    details: error.message
                });
            }
        }
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ 
            error: 'Error creating user account' 
        });
    }
};

// New endpoint to submit signed transaction
export const submitTokenAssociation = async (req: Request, res: Response) => {
    try {
        const { signedTransaction } = req.body;

        if (!signedTransaction) {
            return res.status(400).json({
                error: 'Signed transaction is required'
            });
        }

        // Convert base64 string back to Uint8Array
        const signedTransactionBytes = new Uint8Array(
            Buffer.from(signedTransaction, 'base64')
        );

        const success = await HederaService.submitSignedTransaction(
            signedTransactionBytes
        );

        res.status(200).json({
            success,
            message: success ? 'Token association successful' : 'Token association failed'
        });
    } catch (error) {
        console.error('Submit token association error:', error);
        res.status(500).json({
            error: 'Error submitting token association'
        });
    }
}; 