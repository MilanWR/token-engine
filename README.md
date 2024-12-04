# Token Engine API

A Hedera-based token engine API.

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

## Creating a Mock App Owner

The `createMockAppOwner` script creates a mock app owner with token collections. This is useful for testing purposes.

### Run the Script

```bash
npm run create-mock-app-owner
```

## Testing User Creation and Token Association

### 1. Generate a Key Pair

Generate a new key pair for the test user:

```bash
npm run generate-keypair
```

This will output:
- **Private Key**: Used for signing transactions
- **Public Key**: Used for account creation

### 2. Create User Account

Use the public key to create a new user account:

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "publicKey": "YOUR_PUBLIC_KEY",
    "uid": "test_user_1"
  }'
```

Save the response which contains:
- **Account ID**
- **Unsigned token association transaction**

### 3. Sign and Submit Token Association

1. **Update the private key** in `src/scripts/testSignTransaction.ts` with your generated private key:
   ```typescript
   const privateKey = PrivateKey.fromString("YOUR_PRIVATE_KEY");
   ```

2. **Run the test script** with the response from step 2:
   ```bash
   npm run test-sign '{"publicKey":"YOUR_PUBLIC_KEY","accountId":"ACCOUNT_ID","unsignedTokenAssociateTransaction":"TRANSACTION_FROM_RESPONSE","uid":"test_user_1"}'
   ```

This script will:
- Sign the transaction using the private key
- Submit the signed transaction to the `/api/v1/users/token-association` endpoint

## Development

Start the development server:

```bash
npm run dev
```

## API Endpoints

### Create User Account
- **POST** `/api/v1/users`
- Creates a new user account and returns unsigned token association transaction

### Submit Token Association
- **POST** `/api/v1/users/token-association`
- Submits a signed token association transaction

## Scripts

- `npm run dev` - Start development server
- `npm run create-mock-owner` - Create mock app owner
- `npm run generate-keypair` - Generate new key pair
- `npm run test-sign` - Test token association signing

## Environment Variables

- `DATABASE_URL` - PostgreSQL database URL
- `HEDERA_OPERATOR_ID` - Hedera operator account ID
- `HEDERA_OPERATOR_KEY` - Hedera operator private key
- `HEDERA_NETWORK` - Hedera network (testnet/mainnet)

## Error Handling

Common errors and solutions:

1. **Invalid public key format**: Ensure the public key is in the correct DER encoded format
2. **Transaction expired**: The transaction must be signed and submitted within the validity window
3. **Invalid signature**: Ensure you're using the correct private key for signing

## Security Notes

- Never share private keys
- Store API keys securely
- Keep environment variables confidential
 