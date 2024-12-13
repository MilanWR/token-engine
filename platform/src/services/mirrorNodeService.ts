import axios from 'axios';

const MIRROR_NODE_URL = 'https://testnet.mirrornode.hedera.com';
const DEFAULT_LIMIT = 100;

interface NFTInfo {
    account_id: string;
    created_timestamp: string;
    metadata: string;
    serial_number: number;
    token_id: string;
}

interface NFTTransaction {
    consensus_timestamp: string;
    receiver_account_id: string;
    sender_account_id: string;
    transaction_id: string;
    type: string;
}

interface MirrorNodeResponse<T> {
    [key: string]: T[] | { next: string | null };
    links: {
        next: string | null;
    };
}

export class MirrorNodeService {
    // Get all NFTs for a specific token (with pagination)
    async getAllNFTs(tokenId: string, nextLink?: string): Promise<MirrorNodeResponse<NFTInfo>> {
        const url = nextLink || `${MIRROR_NODE_URL}/api/v1/tokens/${tokenId}/nfts?limit=${DEFAULT_LIMIT}`;
        const response = await axios.get(url);
        return response.data;
    }

    // Get NFTs for specific account and token
    async getAccountNFTs(tokenId: string, accountId: string): Promise<NFTInfo[]> {
        const url = `${MIRROR_NODE_URL}/api/v1/tokens/${tokenId}/nfts?account.id=${accountId}&limit=${DEFAULT_LIMIT}`;
        const response = await axios.get(url);
        return response.data.nfts;
    }

    // Get NFT transaction history
    async getNFTHistory(tokenId: string, serialNumber: number): Promise<NFTTransaction[]> {
        const url = `${MIRROR_NODE_URL}/api/v1/tokens/${tokenId}/nfts/${serialNumber}/transactions?limit=${DEFAULT_LIMIT}`;
        const response = await axios.get(url);
        return response.data.transactions;
    }

    // Get all withdrawn consents (NFTs in treasury account)
    async getWithdrawnConsents(tokenId: string, treasuryId: string): Promise<NFTInfo[]> {
        return await this.getAccountNFTs(tokenId, treasuryId);
    }

    // Helper: Decode NFT metadata
    decodeMetadata(base64Metadata: string): { categoryId: number; hash: string } {
        const buffer = Buffer.from(base64Metadata, 'base64');
        const [categoryId, hash] = buffer.toString('utf8').split(':');
        return {
            categoryId: parseInt(categoryId),
            hash
        };
    }

    // Get consent status with history
    async getConsentStatus(tokenId: string, serialNumber: number): Promise<{
        status: 'active' | 'withdrawn';
        history: NFTTransaction[];
        metadata: { categoryId: number; hash: string };
    }> {
        const [nftInfo, transactions] = await Promise.all([
            this.getAllNFTs(tokenId),
            this.getNFTHistory(tokenId, serialNumber)
        ]);

        const nft = (nftInfo.nfts as NFTInfo[]).find(n => n.serial_number === serialNumber);
        if (!nft) throw new Error('NFT not found');

        const metadata = this.decodeMetadata(nft.metadata);
        const status = transactions[0]?.receiver_account_id === nft.account_id ? 'active' : 'withdrawn';

        return {
            status,
            history: transactions,
            metadata
        };
    }
}

export const mirrorNodeService = new MirrorNodeService(); 