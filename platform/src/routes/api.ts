import express from 'express';
import { authenticateApiKey } from '../middleware/auth';
import { 
    createUser, 
    submitTokenAssociation, 
    createConsent,
    createWithdrawConsentTransaction,
    submitWithdrawConsent,
    createDataCapture,
    verifyDataCapture,
    listDataCaptures,
    listWithdrawnConsents,
    listActiveConsents, 
    getConsentStatus,
    getConsentHistory,
    sendIncentiveTokens,
    createRedeemTokenTransaction,
    submitRedeemTransaction,
    getIncentiveBalance
} from '../controllers/apiController';
import { RequestHandler } from 'express';

const router = express.Router();

// Update type casting to handle async responses
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;


// Cast controller functions to RequestHandler to fix TypeScript errors
const handlers: Record<string, RequestHandler> = {
    createUser: createUser as unknown as RequestHandler,
    submitTokenAssociation: submitTokenAssociation as unknown as RequestHandler,
    createConsent: createConsent as unknown as RequestHandler,
    createWithdrawConsentTransaction: createWithdrawConsentTransaction as unknown as RequestHandler,
    submitWithdrawConsent: submitWithdrawConsent as unknown as RequestHandler,
    createDataCapture: createDataCapture as unknown as RequestHandler,
    verifyDataCapture: verifyDataCapture as unknown as RequestHandler,
    listDataCaptures: listDataCaptures as unknown as RequestHandler,
    getConsentStatus: getConsentStatus as unknown as RequestHandler,
    listActiveConsents: listActiveConsents as unknown as RequestHandler,
    listWithdrawnConsents: listWithdrawnConsents as unknown as RequestHandler,
    getConsentHistory: getConsentHistory as unknown as RequestHandler,
    sendIncentiveTokens: sendIncentiveTokens as unknown as RequestHandler,
    createRedeemTokenTransaction: createRedeemTokenTransaction as unknown as RequestHandler,
    submitRedeemTransaction: submitRedeemTransaction as unknown as RequestHandler,
    getIncentiveBalance: getIncentiveBalance as unknown as RequestHandler
};

// Routes
router.post('/v1/users', authenticateApiKey, handlers.createUser);
router.post('/v1/users/token-association', authenticateApiKey, handlers.submitTokenAssociation);
router.post('/v1/consent', authenticateApiKey, handlers.createConsent);
router.post('/v1/consent/withdraw', authenticateApiKey, handlers.createWithdrawConsentTransaction);
router.post('/v1/consent/withdraw/submit', authenticateApiKey, handlers.submitWithdrawConsent);
router.post('/v1/data-capture', authenticateApiKey, handlers.createDataCapture);
router.get('/v1/data-capture/verify/:accountId/:serialNumber', authenticateApiKey, handlers.verifyDataCapture);
router.get('/v1/data-capture/list', authenticateApiKey, handlers.listDataCaptures);
router.get('/v1/consent/:tokenId/:serialNumber/status', authenticateApiKey, handlers.getConsentStatus);
router.get('/v1/consent/active', authenticateApiKey, handlers.listActiveConsents);
router.get('/v1/consent/withdrawn', authenticateApiKey, handlers.listWithdrawnConsents);
router.get('/v1/consent/:tokenId/:serialNumber/history', authenticateApiKey, handlers.getConsentHistory);
router.post('/v1/incentive/send', authenticateApiKey, handlers.sendIncentiveTokens);
router.post('/v1/incentive/redeem', authenticateApiKey, handlers.createRedeemTokenTransaction);
router.post('/v1/incentive/redeem/submit', authenticateApiKey, handlers.submitRedeemTransaction);
router.get('/v1/incentive/balance/:accountId', authenticateApiKey, handlers.getIncentiveBalance);

export default router;