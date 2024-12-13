'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Consents', href: '/dashboard/consents' },
    { name: 'Data Capture', href: '/dashboard/data-capture' },
    { name: 'Rewards', href: '/dashboard/rewards' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col w-64 bg-gray-800 h-screen">
            <div className="flex items-center justify-center h-16 px-4">
                <h1 className="text-white font-semibold text-lg">Token Engine Demo</h1>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center px-4 py-2 text-sm font-medium rounded-md',
                                isActive
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            )}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
} 