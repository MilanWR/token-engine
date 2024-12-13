import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { PrivateKey, Transaction } from '@hashgraph/sdk';
import { cryptoService } from '@/lib/crypto';
import { apiClient } from '@/lib/api';

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        // Check if user exists locally
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        // 1. Generate Hedera keys locally
        const privateKey = PrivateKey.generateED25519();
        const publicKey = privateKey.publicKey;

        // 2. Create Hedera account through platform
        const platformResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.PLATFORM_API_KEY || ''
            },
            body: JSON.stringify({
                publicKey: publicKey.toString(),
                uid: email
            })
        });

        if (!platformResponse.ok) {
            const errorText = await platformResponse.text();
            console.error('Platform API error:', {
                status: platformResponse.status,
                statusText: platformResponse.statusText,
                body: errorText
            });
            throw new Error(`Failed to create Hedera account: ${errorText}`);
        }

        const { accountId, unsignedTokenAssociateTransaction } = await platformResponse.json();

        // 3. Sign and submit token association transaction
        if (unsignedTokenAssociateTransaction) {
            const buffer = Buffer.from(unsignedTokenAssociateTransaction, 'base64');
            const transaction = Transaction.fromBytes(buffer);
            const signedTx = await transaction.sign(privateKey);
            const signedBytes = signedTx.toBytes();
            const signedBase64 = Buffer.from(signedBytes).toString('base64');

            // Submit token association
            const associationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/token-association`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.PLATFORM_API_KEY || ''
                },
                body: JSON.stringify({
                    accountId,
                    signedTransaction: signedBase64
                })
            });

            if (!associationResponse.ok) {
                console.error('Token association failed:', await associationResponse.text());
            }
        }

        // 4. Encrypt private key and create local user
        const encryptedPrivateKey = await cryptoService.encryptPrivateKey(
            privateKey.toString(),
            password
        );

        const hashedPassword = await hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                privateKey: encryptedPrivateKey,
                publicKey: publicKey.toString(),
                accountId,
            },
        });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                accountId: user.accountId,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Error creating user' },
            { status: 500 }
        );
    }
} 