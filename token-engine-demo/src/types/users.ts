export interface User {
    id: string;
    email: string;
    name?: string;
    accountId: string;  // Hedera account ID
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    name?: string;
}
