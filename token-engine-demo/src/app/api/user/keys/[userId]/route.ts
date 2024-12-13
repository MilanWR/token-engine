import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        
        // Check if user is requesting their own keys
        if (!session || session.user.id !== params.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: params.userId },
            select: { privateKey: true }
        });

        if (!user?.privateKey) {
            return NextResponse.json({ error: 'Keys not found' }, { status: 404 });
        }

        return NextResponse.json({ encryptedPrivateKey: user.privateKey });
    } catch (error) {
        console.error('Error fetching user keys:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 