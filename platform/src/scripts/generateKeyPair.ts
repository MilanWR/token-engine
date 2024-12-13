import { PrivateKey } from "@hashgraph/sdk";

function generateKeyPair() {
    const privateKey = PrivateKey.generate();
    const publicKey = privateKey.publicKey;

    console.log("Private Key:", privateKey.toString());
    console.log("Public Key:", publicKey.toString());
}

// Run the script
generateKeyPair(); 