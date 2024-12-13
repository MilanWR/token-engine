'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useSession } from 'next-auth/react';

export function useDataCapture() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const accountId = session?.user?.accountId;

    const dataQuery = useQuery({
        queryKey: ['data-captures', accountId],
        queryFn: () => accountId ? apiClient.listDataCaptures(accountId) : null,
        enabled: !!accountId,
    });

    const createDataCaptureMutation = useMutation({
        mutationFn: apiClient.createDataCapture,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['data-captures', accountId] });
        },
    });

    return {
        captures: dataQuery.data,
        isLoading: dataQuery.isLoading,
        error: dataQuery.error,
        createCapture: createDataCaptureMutation.mutate,
        isCreating: createDataCaptureMutation.isPending,
    };
} 