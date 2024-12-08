# Token Engine API

A Hedera-based token engine API for managing user consents and data capture through NFTs.

## Table of Contents
1. [Setup](#setup)
2. [Token Structure](#token-structure)
3. [App Owner Structure](#app-owner-structure)
4. [User Management](#user-management)
5. [API Reference](#api-reference)
6. [Development Guide](#development-guide)
7. [Database](#database)
8. [Security](#security)
9. [Testing](#testing)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd token-engine-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your environment variables in `.env`**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/token_engine?schema=public"
   HEDERA_OPERATOR_ID="0.0.XXXXX"
   HEDERA_OPERATOR_KEY="302e......"
   HEDERA_NETWORK="testnet"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

## Token Structure

The API uses three types of Hedera tokens:

1. **Consent Token (NFT)**
   - Type: Non-Fungible Token (NFT)
   - Purpose: Represents user consent records
   - Supply: Infinite
   - Minted when: User gives consent

2. **Data Capture Token (NFT)**
   - Type: Non-Fungible Token (NFT)
   - Purpose: Represents data capture events
   - Supply: Infinite
   - Minted when: Data is captured

3. **Incentive Token (Fungible)**
   - Type: Fungible Token
   - Purpose: Rewards for user participation
   - Supply: Infinite
   - Decimals: 2
   - Initial Supply: 10,000.00 tokens

## App Owner Structure

Each app owner has:
- A dedicated Hedera account (managed by the backend)
- Three token collections (consent, data capture, incentive)
- API key for authentication

The token treasury account:
- Uses the server's private key
- Is separate from the operator account
- Manages all token operations

### Creating a Mock App Owner

To set up a test environment:

```bash
npm run create-mock-owner
```

This script:
1. Creates a new Hedera account for token management
2. Creates the three token collections
3. Sets up a mock app owner in the database
4. Links the tokens to the app owner
5. Outputs:
   - API Key for authentication
   - App Account ID
   - Token IDs for all three collections

Example output:
```
=== Mock App Owner Created Successfully ===
App Owner Details:
Email: mockapp@example.com
API Key: te_f3dad439cb6ba9bd154bb02301a1602a0c239d67832103d4

Hedera Details:
App Account ID: 0.0.1234567
Consent Token ID: 0.0.1234568
Data Capture Token ID: 0.0.1234569
Incentive Token ID: 0.0.1234570

Note: The app account uses the operator's private key for backend control
```

## User Management

### 1. Generate a Key Pair
```bash
npm run generate-keypair
```
This will output:
- **Private Key**: Used for signing transactions
- **Public Key**: Used for account creation

### 2. Create User Account
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "publicKey": "USER_PUBLIC_KEY",
    "uid": "test_user_1"
  }'
```

### 3. Sign and Submit Token Association
Update `src/scripts/testSignTransaction.ts` with your private key and run:
```bash
npm run test-sign '{"publicKey":"YOUR_PUBLIC_KEY","accountId":"ACCOUNT_ID","unsignedTokenAssociateTransaction":"TRANSACTION_FROM_RESPONSE","uid":"test_user_1"}'
```

## API Reference

### User Endpoints

1. **Create User Account**
   - `POST /api/v1/users`
   - Creates new account and returns unsigned association transaction
   
   Request Body:
   ```json
   {
       "publicKey": "302a300506032b6570032100114e6abc371b82dab5c15ea149f02d34a012087b163516dd70f44acafabf7777",
       "uid": "test_user_1"
   }
   ```
   
   Response:
   ```json
   {
       "accountId": "0.0.1234567",
       "unsignedTokenAssociateTransaction": "base64_encoded_transaction",
       "uid": "test_user_1"
   }
   ```

2. **Submit Token Association**
   - `POST /api/v1/users/token-association`
   - Submits signed token association transaction
   
   Request Body:
   ```json
   {
       "signedTransaction": "base64_encoded_transaction",
       "accountId": "0.0.1234567",
       "uid": "test_user_1"
   }
   ```
   
   Response:
   ```json
   {
       "success": true,
       "message": "Token association completed successfully"
   }
   ```

### Consent Management

1. **Consent NFT Structure**
   Each consent NFT's metadata contains:
   - Category ID: Identifies the type of consent
   - Consent Hash: The actual consent data
   - Format: `categoryId:consentHash`

   Example metadata: `1:QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt`

2. **Create Consent**
   Request Body:
   ```json
   {
       "accountId": "0.0.123456",
       "consentHash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
       "categoryId": 1,
       "uid": "optional-user-id"
   }
   ```
   
   Response:
   ```json
   {
       "success": true,
       "serialNumber": 1,
       "transactionId": "0.0.1234@1234567890.000000000",
       "accountId": "0.0.123456",
       "uid": "test_user_1"
   }
   ```

3. **Withdraw Consent**
   
   a. Generate unsigned transaction:
   ```http
   POST /api/consent/withdraw
   ```
   Request Headers:
   - `X-API-Key`: Your API key
   
   Request Body:
   ```json
   {
       "accountId": "0.0.xxxxx",
       "uid": "user_identifier",
       "serialNumber": 123,
       "consentHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
   }
   ```
   
   Response:
   ```json
   {
       "unsignedWithdrawTransaction": "base64_encoded_transaction",
       "accountId": "0.0.xxxxx",
       "uid": "user_identifier",
       "consentHash": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
   }
   ```

   b. Submit signed transaction:
   ```http
   POST /api/consent/withdraw/submit
   ```
   Request Headers:
   - `X-API-Key`: Your API key
   
   Request Body:
   ```json
   {
       "signedTransaction": "base64_encoded_transaction",
       "accountId": "0.0.xxxxx",
       "uid": "user_identifier"
   }
   ```
   
   Response:
   ```json
   {
       "success": true,
       "message": "Consent withdrawn successfully"
   }
   ```

### Error Responses

All endpoints may return the following error format:

```json
{
    "error": "Error message description",
    "details": "Additional error details (if available)"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid API key)
- `404`: Not Found
- `500`: Internal Server Error

## Development Guide

Start the development server:
```bash
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run create-mock-owner` - Create mock app owner
- `npm run generate-keypair` - Generate new key pair
- `npm run test-sign` - Test transaction signing

## Database

### Structure
Key relationships:
- **User -> Consent**: One-to-many relationship
- **User -> TokenIds**: One-to-many relationship
- **User -> ApiUsage**: One-to-many relationship
- **User -> Subscription**: One-to-one relationship

### Migrations
When making schema changes:
1. Update `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name description_of_changes
   ```
3. For complex migrations:
   ```bash
   npx prisma migrate dev --create-only --name description_of_changes
   # Edit migration file in prisma/migrations/
   npx prisma migrate dev
   ```

## Security

### Environment Variables
```env
# Hedera Network
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e020100...
HEDERA_NETWORK=testnet

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/token_engine?schema=public"

# API Configuration
PORT=3000
NODE_ENV=development
```

### Best Practices
- Never share private keys
- Store API keys securely
- Keep environment variables confidential

### Error Handling
Common issues:
1. **Invalid public key format**: Check DER encoding
2. **Transaction expired**: Sign and submit within validity window
3. **Invalid signature**: Verify private key
 
## Data Capture API

### Consent NFT Structure
Each consent NFT's metadata contains:
- Category ID: Identifies the type of consent
- Consent Hash: The actual consent data
- Format: `categoryId:consentHash` (stored as base64 on-chain)

Example metadata: `1:QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt`

### Create Consent
- **POST** `/api/v1/consent`
- Creates a new consent NFT with categorized metadata

Request Body:
```json
{
    "accountId": "0.0.123456",
    "consentHash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
    "categoryId": 1, //you could have multiple consents for different things. each different consent needs a different Id.
    "uid": "optional-user-id"
}
```

Response:
```json
{
    "success": true,
    "serialNumber": 4,
    "transactionId": "0.0.123@1234567890.000",
    "accountId": "0.0.123456",
    "categoryId": 1,
    "consentHash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
    "uid": "optional-user-id"  // Only included if provided in request
}
```

### Create Data Capture
- **POST** `/api/v1/data-capture`
- Creates a new data capture NFT
- Verifies consent by checking for a valid consent NFT with matching categoryId

Request Body:
```json
{
    "accountId": "0.0.123456",
    "dataHash": "hash-of-captured-data",
    "categoryId": 1,
    "uid": "optional-user-id"
}
```

Response:
```json
{
    "success": true,
    "serialNumber": 1,
    "transactionId": "0.0.123@1234567890.000",
    "accountId": "0.0.123456",
    "dataHash": "hash-of-captured-data",
    "categoryId": 1,
    "uid": "optional-user-id"  // Only included if provided in request
}
```

### Consent Verification Process
1. API retrieves all consent NFTs for the account from Hedera Mirror Node
2. Decodes the base64 metadata of each NFT
3. Checks for a consent NFT with matching categoryId
4. Only proceeds with data capture if valid consent is found

### Error Responses
- `404 Not Found`: If no valid consent NFT found for the specified category
- `400 Bad Request`: If required fields are missing
- `500 Internal Server Error`: For other processing errors

### List Data Captures
- **GET** `/api/v1/data-capture/list?accountId=0.0.123456&categoryId=1`
- Lists all data captures for an account
- Optional categoryId filter

Response:
```json
{
    "success": true,
    "dataCaptures": [
        {
            "id": "uuid",
            "accountId": "0.0.123456",
            "dataHash": "hash-of-captured-data",
            "categoryId": 1,
            "consentId": 12345,
            "serialNumber": 1,
            // ... other fields
        }
    ]
}
``` 

## Testing

### Account Creation & Token Association
To test the full flow of creating a new account and associating tokens:

1. Run the automated test script:
```bash
npm run test-account-creation
```

This script will:
- Create a new user account with a test public key
- Sign the token association transaction with the matching private key
- Submit the signed transaction to associate tokens

### Manual Testing
If you need to test the endpoints individually:

1. Create User Account
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "publicKey": "YOUR_PUBLIC_KEY"
  }'
```

2. Sign the transaction (using test-sign script)
```bash
npm run test-sign -- '{"unsignedTokenAssociateTransaction":"TRANSACTION_FROM_STEP_1","accountId":"ACCOUNT_ID_FROM_STEP_1"}'
```

3. Submit Token Association
```bash
curl -X POST http://localhost:3000/api/v1/users/token-association \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "accountId": "ACCOUNT_ID_FROM_STEP_1",
    "signedTransaction": "SIGNED_TRANSACTION_FROM_STEP_2"
  }'
``` 

## Consent Management API

### Consent NFT Structure
Each consent NFT's metadata contains:
- Category ID: Identifies the type of consent
- Consent Hash: The actual consent data
- Format: `categoryId:consentHash` (stored as base64 on-chain)

### List Active Consents
- **GET** `/api/v1/consent/active`
- Lists all active consent NFTs

Response:
```json
{
    "consents": [
        {
            "serialNumber": 4,
            "accountId": "0.0.5229278",
            "categoryId": 1,
            "hash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt",
            "timestamp": "1733695810.545369699"
        }
    ]
}
```

### List Withdrawn Consents
- **GET** `/api/v1/consent/withdrawn`
- Lists all consent NFTs that have been withdrawn (returned to treasury)

Response:
```json
{
    "withdrawnConsents": [
        {
            "serialNumber": 1,
            "categoryId": 1,
            "timestamp": "1733688725.108536000"
        }
    ]
}
```

### Get Consent Status
- **GET** `/api/v1/consent/{tokenId}/{serialNumber}/status`
- Returns the current status of a specific consent NFT

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
        "hash": "QmX4zdJ6DSRKoCzkbp7dDqbN5UpePGJjhLHyZQhcWJfBZt"
    }
}
```

### Get Consent History
- **GET** `/api/v1/consent/{tokenId}/{serialNumber}/history`
- Returns the complete lifecycle of a consent NFT

Response:
```json
{
    "serialNumber": 4,
    "status": "active",
    "consentGranted": {
        "timestamp": "2024-12-08T22:10:10.000Z",
        "transactionId": "0.0.1293-1733695800-115735262",
        "grantedTo": "0.0.5229278"
    },
    "consentWithdrawn": null,
    "detailedHistory": [
        {
            "timestamp": "2024-12-08T22:10:10.000Z",
            "action": "MINT",
            "from": "TREASURY",
            "to": "0.0.5229051",
            "transactionId": "0.0.1293-1733695800-115735262"
        },
        {
            "timestamp": "2024-12-08T22:10:12.000Z",
            "action": "TRANSFER",
            "from": "0.0.5229051",
            "to": "0.0.5229278",
            "transactionId": "0.0.1293-1733695803-449454479"
        }
    ]
}
```

### Error Responses
All endpoints may return the following error responses:
- `404 Not Found`: If the consent NFT doesn't exist
- `500 Internal Server Error`: For processing errors

### Notes
- All timestamps are provided in both UNIX format (for precise ordering) and ISO format (for readability)
- NFT history is ordered chronologically
- Actions are labeled as MINT, TRANSFER, or WITHDRAW for clarity
- Treasury account transfers indicate consent withdrawal 