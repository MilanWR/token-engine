'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function RewardsPage() {
    const { data: session } = useSession();
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const response = await fetch(`/api/incentive/balance?accountId=${session?.user?.accountId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch balance');
                }
                const data = await response.json();
                setBalance(data.balance);
            } catch (err) {
                setError('Failed to fetch token balance');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user?.accountId) {
            fetchBalance();
        }
    }, [session?.user?.accountId]);

    const handleRedeemReward = async () => {
        setIsRedeeming(true);
        setError(null);

        try {
            const response = await fetch('/api/rewards/redeem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: session?.user?.id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to redeem reward');
            }

            // Refresh balance after successful redemption
            const newBalanceResponse = await fetch(`/api/tokens/balance/${session?.user?.id}`);
            if (newBalanceResponse.ok) {
                const data = await newBalanceResponse.json();
                setBalance(data.balance);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to redeem reward');
        } finally {
            setIsRedeeming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Rewards</h1>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Rewards</h1>
            <div className="max-w-md">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold mb-2">Current Balance</h2>
                    <p className="text-2xl">{balance?.toLocaleString() ?? '0'} Tokens</p>
                </div>

                {error && (
                    <div className="text-red-500 mb-4">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleRedeemReward}
                    disabled={isRedeeming || !balance || balance <= 0}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {isRedeeming ? 'Redeeming...' : 'Redeem All Tokens'}
                </button>
            </div>
        </div>
    );
}