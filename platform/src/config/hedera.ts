import { Client, AccountId, PrivateKey, PublicKey } from "@hashgraph/sdk";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
const operatorId = process.env.HEDERA_OPERATOR_ID;
const operatorKeyString = process.env.HEDERA_OPERATOR_KEY;
const network = process.env.HEDERA_NETWORK || "testnet";

// Validate environment variables
if (!operatorId || !operatorKeyString) {
    throw new Error("Environment variables HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required.");
}

// Create Hedera client
let client: Client;
if (network === "mainnet") {
    client = Client.forMainnet();
} else {
    client = Client.forTestnet();
}

// Set up operator keys
export const operatorKey = PrivateKey.fromString(operatorKeyString);
export const operatorPublicKey = operatorKey.publicKey;

// Set the operator
client.setOperator(
    AccountId.fromString(operatorId),
    operatorKey
);

export { client }; 