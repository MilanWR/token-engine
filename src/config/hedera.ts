import { Client, AccountId, PrivateKey, PublicKey } from "@hashgraph/sdk";

// Load environment variables
const operatorId = process.env.HEDERA_OPERATOR_ID;
const operatorKey = process.env.HEDERA_OPERATOR_KEY;
const network = process.env.HEDERA_NETWORK || "testnet";

if (!operatorId || !operatorKey) {
    throw new Error("Environment variables HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required.");
}

// Create Hedera client
let client: Client;

if (network === "mainnet") {
    client = Client.forMainnet();
} else {
    client = Client.forTestnet();
}

// Set the operator
const operatorPrivateKey = PrivateKey.fromString(operatorKey);
const operatorPublicKey = operatorPrivateKey.publicKey;

client.setOperator(
    AccountId.fromString(operatorId),
    operatorPrivateKey
);

export { client, operatorPublicKey }; 