'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useConsents() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const accountId = session?.user?.accountId;

    const consentsQuery = useQuery({
        queryKey: ['consents', accountId],
        queryFn: () => accountId ? apiClient.getActiveConsents(accountId) : null,
        enabled: !!accountId,
    });

    const createConsentMutation = useMutation({
        mutationFn: apiClient.createConsent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['consents', accountId] });
        },
    });

    return {
        consents: consentsQuery.data,
        isLoading: consentsQuery.isLoading,
        error: consentsQuery.error,
        createConsent: createConsentMutation.mutate,
        isCreating: createConsentMutation.isPending,
    };
} 