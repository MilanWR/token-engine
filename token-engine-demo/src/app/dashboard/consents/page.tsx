'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ConsentsPage() {
    const { data: session } = useSession();
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateConsent = async () => {
        if (!description.trim()) {
            setError('Please enter a description');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const response = await fetch('/api/consents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    userId: session?.user?.id
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create consent');
            }

            setDescription('');
            // Optionally add success message or redirect
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create consent');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Create Consent</h1>
            <div className="max-w-md">
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter consent description"
                    className="w-full p-2 border rounded mb-4"
                    rows={4}
                />
                {error && (
                    <div className="text-red-500 mb-4">
                        {error}
                    </div>
                )}
                <button
                    onClick={handleCreateConsent}
                    disabled={isCreating}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {isCreating ? 'Creating...' : 'Create Consent'}
                </button>
            </div>
        </div>
    );
} 