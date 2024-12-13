import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useApi() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async <T>(
        requestFn: () => Promise<T>,
        errorMessage: string = 'An error occurred'
    ): Promise<T | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await requestFn();
            return result;
        } catch (err) {
            console.error(err);
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        api: {
            createConsent: (data: Parameters<typeof apiClient.createConsent>[0]) =>
                handleRequest(() => apiClient.createConsent(data), 'Failed to create consent'),

            getActiveConsents: (accountId: string) =>
                handleRequest(() => apiClient.getActiveConsents(accountId), 'Failed to fetch consents'),

            createDataCapture: (data: Parameters<typeof apiClient.createDataCapture>[0]) =>
                handleRequest(() => apiClient.createDataCapture(data), 'Failed to create data capture'),

            getBalance: (accountId: string) =>
                handleRequest(() => apiClient.getBalance(accountId), 'Failed to fetch balance'),

            createRedeemTransaction: (data: Parameters<typeof apiClient.createRedeemTransaction>[0]) =>
                handleRequest(() => apiClient.createRedeemTransaction(data), 'Failed to create redeem transaction'),

            submitRedeemTransaction: (data: Parameters<typeof apiClient.submitRedeemTransaction>[0]) =>
                handleRequest(() => apiClient.submitRedeemTransaction(data), 'Failed to submit redeem transaction'),
        }
    };
} 