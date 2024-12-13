import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Missing credentials');
                }

                // TODO: Add your user verification logic here
                // This is where we'll check the user's credentials against your database
                // and handle the encrypted private key

                // For now, return a mock user
                return {
                    id: '1',
                    email: credentials.email,
                    name: 'Test User',
                    accountId: '0.0.123456'
                };
            }
        })
    ],
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.accountId = token.accountId as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.accountId = user.accountId;
            }
            return token;
        }
    }
});

export { handler as GET, handler as POST }; 