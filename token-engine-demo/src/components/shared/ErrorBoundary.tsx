'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <h2 className="text-red-800 font-semibold">Something went wrong</h2>
                    <p className="text-red-600 text-sm mt-1">
                        {this.state.error?.message || 'An error occurred'}
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
} 