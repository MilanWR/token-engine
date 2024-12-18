# HealthToken AI Engine API

A Hedera-based engine API for managing user consents, data capture, and incentive token operations.

## Table of Contents
1. [Setup](#setup)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)
4. [Development Guide](#development-guide)
5. [Testing](#testing)
6. [Security](#security)
7. [Database Schema](#database-schema)


## Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd token-engine-api
   npm install
   ```

2. **Environment Variables**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/token_engine?schema=public"
   HEDERA_OPERATOR_ID="0.0.XXXXX"
   HEDERA_OPERATOR_KEY="302e......"
   HEDERA_NETWORK="testnet"
   ```

3. **Database Setup**
   ```bash
   npx prisma migrate dev
   ```

## Architecture

### Token Structure

The system uses three Hedera tokens:

1. **Consent NFT**
   - Non-Fungible Token representing user consents
   - Metadata format: `categoryId:consentHash`
   - Example: `1:QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt`

2. **Data Capture NFT**
   - Non-Fungible Token representing data capture events
   - Metadata format: `categoryId:dataHash`
   - Example: `1:QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt`

3. **Incentive Token**
   - Fungible Token for rewards
   - 2 decimal places
   - Initial supply: 10,000.00

### App Owner Structure

Each app owner has:
- Dedicated Hedera account
- Three token collections
- API key for authentication
- Treasury account for token operations

#### Setup Mock App Owner

```bash
npm run create-mock-owner
```

Example output:
```
=== Mock App Owner Created Successfully ===
Email: mockapp@example.com
API Key: te_f3dad439cb6ba9bd154bb02301a1602a0c239d67832103d4
App Account ID: 0.0.1234567
Consent Token ID: 0.0.1234568
Data Capture Token ID: 0.0.1234569
Incentive Token ID: 0.0.1234570
```

### Sequence Diagrams

HealthToken.AI consists of several key flows that enable secure consent management, data capture, and incentivization. Below are the detailed sequence diagrams for each flow:

### User Creation Flow
![User Creation Flow](./docs/images/usercreation.png)
The user creation process establishes a new account on the Hedera network with the necessary token associations.

### Consent Management Flow
![Consent Flow](./docs/images/consent.png)
Consent is managed through NFTs, providing verifiable proof of user consent status.

### Data Capture Flow
![Data Capture Flow](./docs/images/dataCapture.png)
Data capture is conditional on active consent and can include automatic incentivization.

### Incentive Management Flow
![Incentive Flow](./docs/images/incentive.png)
The incentive system enables automatic rewards and token redemption.

### App Owner Setup Flow
![Owner Flow](./docs/images/ownerFlow.png)
App owners can set up their environment with necessary tokens and configurations.

## API Reference

### Authentication
All endpoints require an API key in the header:
```
X-API-Key: your_api_key
```

### User Management

1. **Create User Account**
   - `POST /api/v1/users`
   
   Request:
   ```json
   {
       "publicKey": "302a300506032b6570...",
       "uid": "optional_user_id"
   }
   ```
   
   Response (201 Created):
   ```json
   {
       "accountId": "0.0.1234567",
       "unsignedTokenAssociateTransaction": "base64_encoded_transaction",
       "uid": "optional_user_id"
   }
   ```
   
   Error Responses:
   - `400`: Invalid public key format
   - `401`: Invalid API key
   - `500`: Account creation failed

2. **Submit Token Association**
   - `POST /api/v1/users/token-association`
   
   Request:
   ```json
   {
       "signedTransaction": "base64_encoded_transaction",
       "accountId": "0.0.1234567",
       "uid": "optional_user_id"
   }
   ```
   
   Response (200 OK):
   ```json
   {
       "success": true,
       "message": "Token association completed successfully",
       "accountId": "0.0.1234567",
       "uid": "optional_user_id"
   }
   ```

### Consent Operations

1. **Create Consent**
   - `POST /api/v1/consent`
   
   Request:
   ```json
   {
       "accountId": "0.0.123456",
       "consentHash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
       "categoryId": 1,
       "incentiveAmount": 10,  // Optional
       "uid": "optional_user_id"  // Optional
   }
   ```
   
   Response (201 Created):
   ```json
   {
       "success": true,
       "serialNumber": 1,
       "transactionId": "0.0.123@1234567890.000",
       "accountId": "0.0.123456",
       "categoryId": 1,
       "consentHash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
       "incentiveAmount": 10,  // Only if provided
       "uid": "optional_user_id"  // Only if provided
   }
   ```

2. **Withdraw Consent**
   
   a. Generate unsigned transaction:
   - `POST /api/v1/consent/withdraw`
   
   Request:
   ```json
   {
       "accountId": "0.0.123456",
       "serialNumber": 1,
       "consentHash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
       "uid": "optional_user_id"
   }
   ```
   
   Response (200 OK):
   ```json
   {
       "unsignedWithdrawTransaction": "base64_encoded_transaction",
       "accountId": "0.0.123456",
       "serialNumber": 1,
       "uid": "optional_user_id"
   }
   ```
   
   b. Submit signed transaction:
   - `POST /api/v1/consent/withdraw/submit`
   
   Request:
   ```json
   {
       "signedTransaction": "base64_encoded_transaction",
       "accountId": "0.0.123456",
       "uid": "optional_user_id"
   }
   ```
   
   Response (200 OK):
   ```json
   {
       "success": true,
       "message": "Consent withdrawn successfully",
       "transactionId": "0.0.123@1234567890.000"
   }
   ```

3. **Query Consents**

   a. List Active Consents:
   - `GET /api/v1/consent/active?accountId=0.0.123456&categoryId=1`
   
   Response:
   ```json
   {
       "consents": [
           {
               "serialNumber": 1,
               "accountId": "0.0.123456",
               "categoryId": 1,
               "consentHash": "QmX4zdJ6...",
               "timestamp": "1733695810.545369699",
               "uid": "optional_user_id"
           }
       ]
   }
   ```

   b. List Withdrawn Consents:
   - `GET /api/v1/consent/withdrawn?accountId=0.0.123456&categoryId=1`
   
   Response:
   ```json
   {
       "withdrawnConsents": [
           {
               "serialNumber": 1,
               "categoryId": 1,
               "consentHash": "QmX4zdJ6...",
               "timestamp": "1733695810.545369699",
               "uid": "optional_user_id"
           }
       ]
   }
   ```

   c. Get Consent Status:
   - `GET /api/v1/consent/{tokenId}/{serialNumber}/status`
   
   Response:
   ```json
   {
       "status": "active",
       "history": [
           {
               "consensus_timestamp": "1733695812.921799541",
               "type": "CRYPTOTRANSFER",
               "receiver_account_id": "0.0.5229278",
               "sender_account_id": "0.0.5229051"
           }
       ],
       "metadata": {
           "categoryId": 1,
           "hash": "QmX4zdJ6..."
       }
   }
   ```

### Data Capture Operations

1. **Create Data Capture**
   - `POST /api/v1/data-capture`
   
   Request:
   ```json
   {
       "accountId": "0.0.123456",
       "dataHash": "QmX4zdJ6...",
       "categoryId": 1,
       "incentiveAmount": 5,  // Optional
       "uid": "optional_user_id"  // Optional
   }
   ```
   
   Response (201 Created):
   ```json
   {
       "success": true,
       "serialNumber": 1,
       "transactionId": "0.0.123@1234567890.000",
       "accountId": "0.0.123456",
       "dataHash": "QmX4zdJ6...",
       "categoryId": 1,
       "incentiveAmount": 5,  // Only if provided
       "uid": "optional_user_id"  // Only if provided
   }
   ```

2. **Query Data Captures**
   - `GET /api/v1/data-capture/list?accountId=0.0.123456&categoryId=1`
   
   Response:
   ```json
   {
       "dataCaptures": [
           {
               "serialNumber": 1,
               "accountId": "0.0.123456",
               "dataHash": "QmX4zdJ6...",
               "categoryId": 1,
               "timestamp": "1733695810.545369699",
               "uid": "optional_user_id"
           }
       ]
   }
   ```

### Incentive Operations

1. **Send Tokens**
   - `POST /api/v1/incentive/send`
   
   Request:
   ```json
   {
       "accountId": "0.0.123456",
       "amount": 100,
       "memo": "optional_memo"
   }
   ```
   
   Response:
   ```json
   {
       "success": true,
       "transactionId": "0.0.123@1234567890.000",
       "amount": 100,
       "accountId": "0.0.123456"
   }
   ```

2. **Redeem Tokens**
   
   a. Create redeem transaction:
   - `POST /api/v1/incentive/redeem`
   
   Request:
   ```json
   {
       "accountId": "0.0.123456",
       "amount": 50,
       "memo": "optional_memo"
   }
   ```
   
   Response:
   ```json
   {
       "unsignedRedeemTransaction": "base64_encoded_transaction",
       "accountId": "0.0.123456",
       "amount": 50,
       "memo": "optional_memo"
   }
   ```
   
   b. Submit signed transaction:
   - `POST /api/v1/incentive/redeem/submit`
   
   Request:
   ```json
   {
       "accountId": "0.0.123456",
       "signedTransaction": "base64_encoded_transaction"
   }
   ```
   
   Response:
   ```json
   {
       "success": true,
       "transactionId": "0.0.123@1234567890.000",
       "amount": 50,
       "accountId": "0.0.123456"
   }
   ```

3. **Check Balance**
   - `GET /api/v1/incentive/balance/{accountId}`
   
   Response:
   ```json
   {
       "balance": 150.00,
       "accountId": "0.0.123456"
   }
   ```

### Error Responses
All endpoints use consistent error format:
```json
{
    "error": "Error description",
    "details": "Additional details if available"
}
```

Common status codes:
- `400`: Bad Request
- `401`: Invalid API Key
- `404`: Resource Not Found
- `500`: Server Error

## Development Guide

### Available Scripts
- `npm run dev`: Start development server
- `npm run generate-keypair`: Generate new key pair
- `npm run test-sign`: Test transaction signing

### Testing
For full integration testing:
```bash
npm run test-account-creation
npm run test-redeem
```

Required test environment variables:
```env
TEST_API_KEY=your_api_key
USER_ACCOUNT_ID=0.0.xxxxx
USER_PRIVATE_KEY=302e...
```

## Security

### Best Practices
- Never share private keys
- Store API keys securely
- Keep environment variables confidential
- Use HTTPS in production
- Implement rate limiting

### Common Issues & Troubleshooting

1. **Transaction Signing**
   - Ensure private key matches the account
   - Check transaction validity window (max 2 minutes)
   - Verify network (testnet/mainnet) matches

2. **Token Association**
   - Account must be associated before receiving tokens
   - Check for sufficient HBAR balance
   - Verify all three tokens are included

3. **API Key Issues**
   - Ensure key is included in X-API-Key header
   - Check key format and validity
   - Verify app owner exists in database

## Database Schema

### Core Tables

1. **Users**
   - Stores app owners and their API keys
   - Links to token collections

2. **TokenIds**
   - Maps app owners to their token IDs
   - Stores treasury account information

3. **ApiUsage**
   - Tracks API usage per app owner
   - Monitors rate limits

### Migrations
Run migrations:
```bash
npx prisma migrate dev
```

Create new migration:
```bash
npx prisma migrate dev --name description_of_changes
```



