'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useRewards() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const accountId = session?.user?.accountId;

    const balanceQuery = useQuery({
        queryKey: ['balance', accountId],
        queryFn: () => accountId ? apiClient.getBalance(accountId) : null,
        enabled: !!accountId,
    });

    const redeemMutation = useMutation({
        mutationFn: apiClient.createRedeemTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['balance', accountId] });
        },
    });

    return {
        balance: balanceQuery.data?.balance || 0,
        isLoading: balanceQuery.isLoading,
        error: balanceQuery.error,
        redeem: redeemMutation.mutate,
        isRedeeming: redeemMutation.isPending,
    };
} 