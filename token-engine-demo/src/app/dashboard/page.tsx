import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Welcome, {session?.user?.name || 'User'}!</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Active Consents</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Data Captures</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-2">Reward Balance</h2>
                    <p className="text-3xl font-bold">0</p>
                </div>
            </div>
        </div>
    );
}