export interface CreateUserRequest {
  publicKey: string;
  uid?: string;
}

export interface CreateUserResponse {
  uid?: string;
  publicKey: string;
  accountId: string;  // For now, we'll mock this
}

// Request type for consent endpoint
export interface CreateConsentRequest {
    accountId: string;
    uid?: string;
    consentHash: string;
}

// Response type for consent endpoint
export interface CreateConsentResponse {
    serialNumber: number;
    transactionId: string;
    accountId: string;
    uid?: string;
}

// Request type for withdraw consent endpoint
export interface WithdrawConsentRequest {
    accountId: string;
    uid?: string;
    serialNumber: number;
    consentHash: string;
}

// Response type for withdraw consent endpoint
export interface WithdrawConsentResponse {
    unsignedWithdrawTransaction: string;  // base64 encoded transaction bytes
    accountId: string;
    uid?: string;
    consentHash: string;
} 