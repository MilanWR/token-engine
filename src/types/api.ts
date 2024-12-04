export interface CreateUserRequest {
  publicKey: string;
  uid?: string;
}

export interface CreateUserResponse {
  uid?: string;
  publicKey: string;
  accountId: string;  // For now, we'll mock this
} 