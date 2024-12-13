import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { accountId: string } }
) {
    try {
        // Await the accountId from params
        const accountId = await Promise.resolve(params.accountId);
        
        // Forward request to platform
        const platformResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/incentive/balance/${accountId}`,
            {
                headers: {
                    'x-api-key': process.env.PLATFORM_API_KEY || ''
                }
            }
        );

        if (!platformResponse.ok) {
            throw new Error(`Platform returned ${platformResponse.status}`);
        }

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