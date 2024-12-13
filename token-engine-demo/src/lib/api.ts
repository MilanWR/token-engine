import axios from 'axios';
import { hederaService } from './hedera';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface RegisterData {
    email: string;
    password: string;
    name?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export const apiClient = {
    // Auth
    register: async (data: RegisterData) => {
        const response = await api.post('/api/v1/auth/register', data);
        return response.data;
    },

    // User
    createHederaAccount: async (userId: string) => {
        const response = await api.post('/api/v1/users', { userId });
        return response.data;
    },

    associateTokens: async (accountId: string, privateKey: string) => {
        // Get token IDs from your backend
        const { data: tokens } = await api.get('/api/v1/tokens');
        
        // Create and sign association transactions
        const signedTransactions = await Promise.all(
            tokens.map(async (token: { id: string }) => {
                const txBytes = await hederaService.associateToken(
                    accountId,
                    token.id,
                    privateKey
                );
                return Buffer.from(txBytes).toString('base64');
            })
        );

        // Submit signed transactions
        const response = await api.post('/api/v1/users/token-association', {
            accountId,
            signedTransactions
        });
        
        return response.data;
    },

    // Consents
    createConsent: async (data: { accountId: string; consentHash: string; categoryId: number }) => {
        const response = await api.post('/api/v1/consent', data);
        return response.data;
    },

    getActiveConsents: async (accountId: string) => {
        const response = await api.get(`/api/v1/consent/active?accountId=${accountId}`);
        return response.data;
    },

    // Data Capture
    createDataCapture: async (data: { accountId: string; dataHash: string; categoryId: number }) => {
        const response = await api.post('/api/v1/data-capture', data);
        return response.data;
    },

    // Incentive Tokens
    getBalance: async (accountId: string) => {
        const response = await api.get(`/api/v1/incentive/balance/${accountId}`);
        return response.data;
    },

    createRedeemTransaction: async (data: { accountId: string; amount: number; privateKey: string }) => {
        const { accountId, amount, privateKey } = data;
        
        // Get token ID from your backend
        const { data: { tokenId } } = await api.get('/api/v1/tokens/incentive');
        
        // Create and sign transaction
        const txBytes = await hederaService.createRedeemTransaction(
            accountId,
            tokenId,
            amount,
            privateKey
        );
        
        const signedTransaction = Buffer.from(txBytes).toString('base64');
        
        const response = await api.post('/api/v1/incentive/redeem', {
            accountId,
            amount,
            signedTransaction
        });
        
        return response.data;
    },

    submitRedeemTransaction: async (data: { accountId: string; signedTransaction: string }) => {
        const response = await api.post('/api/v1/incentive/redeem/submit', data);
        return response.data;
    },

    // Users
    createUser: async (data: { publicKey: string; uid: string }) => {
        const response = await api.post('/api/v1/users', data);
        return response.data;
    }
}; 