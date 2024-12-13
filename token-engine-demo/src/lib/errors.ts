export class CryptoError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'CryptoError';
    }
}

export class TransactionError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'TransactionError';
    }
}

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'ApiError';
    }
} 