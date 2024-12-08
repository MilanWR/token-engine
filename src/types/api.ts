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
    categoryId: number;
    incentiveAmount?: number;  // Optional incentive reward
}

// Response type for consent endpoint
export interface CreateConsentResponse {
    success: boolean;
    serialNumber: number;
    transactionId: string;
    accountId: string;
    categoryId: number;
    consentHash: string;
    incentiveAmount?: number;  // Included if incentive was given
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

export interface CreateDataCaptureRequest {
  accountId: string;
  uid?: string;
  dataHash: string;
  categoryId: number;
  incentiveAmount?: number;  // Optional incentive reward
}

export interface CreateDataCaptureResponse {
  success: boolean;
  serialNumber: number;
  transactionId: string;
  accountId: string;
  dataHash: string;
  categoryId: number;
  incentiveAmount?: number;  // Included if incentive was given
  uid?: string;
}

// Add new interfaces for incentive token operations
export interface SendIncentiveRequest {
    accountId: string;
    amount: number;
    memo?: string;
}

export interface SendIncentiveResponse {
    success: boolean;
    transactionId?: string;
}

export interface CreateRedeemRequest {
    accountId: string;
    amount: number;
    memo?: string;
}

export interface CreateRedeemResponse {
    unsignedRedeemTransaction: string;
    accountId: string;
    amount: number;
    memo?: string;
}

export interface SubmitRedeemRequest {
    accountId: string;
    signedTransaction: string;
}

export interface SubmitRedeemResponse {
    success: boolean;
    message: string;
} 