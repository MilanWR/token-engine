import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiClient } from '@/lib/api';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.accountId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount } = await request.json();

        const response = await apiClient.createRedeemTransaction({
            accountId: session.user.accountId,
            amount
        });

        return NextResponse.json({ unsignedTransaction: response.unsignedTransaction });
    } catch (error) {
        console.error('Error creating transaction:', error);
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        );
    }
} 