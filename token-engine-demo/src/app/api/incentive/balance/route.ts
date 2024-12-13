import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId');

        if (!accountId) {
            return NextResponse.json(
                { error: 'Account ID is required' },
                { status: 400 }
            );
        }

        const platformResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incentive/balance/${accountId}`,
            {
                headers: {
                    'x-api-key': process.env.PLATFORM_API_KEY || ''
                }
            }
        );

        const data = await platformResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching balance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balance' },
            { status: 500 }
        );
    }
}