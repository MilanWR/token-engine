import express, { Request, Response, NextFunction, RequestHandler } from 'express';
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

const router = express.Router();

// Update AsyncHandler to allow Response returns
type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

// Update wrapper to handle Response returns and void
const wrapHandler = (handler: AsyncHandler): RequestHandler => {
    return (req, res, next) => {
        handler(req, res, next).catch(next);
        return;
    };
};

const handlers = {
    createUser: wrapHandler(createUser),
    submitTokenAssociation: wrapHandler(submitTokenAssociation),
    createConsent: wrapHandler(createConsent),
    createWithdrawConsentTransaction: wrapHandler(createWithdrawConsentTransaction),
    submitWithdrawConsent: wrapHandler(submitWithdrawConsent),
    createDataCapture: wrapHandler(createDataCapture),
    verifyDataCapture: wrapHandler(verifyDataCapture),
    listDataCaptures: wrapHandler(listDataCaptures),
    getConsentStatus: wrapHandler(getConsentStatus),
    listActiveConsents: wrapHandler(listActiveConsents),
    listWithdrawnConsents: wrapHandler(listWithdrawnConsents),
    getConsentHistory: wrapHandler(getConsentHistory),
    sendIncentiveTokens: wrapHandler(sendIncentiveTokens),
    createRedeemTokenTransaction: wrapHandler(createRedeemTokenTransaction),
    submitRedeemTransaction: wrapHandler(submitRedeemTransaction),
    getIncentiveBalance: wrapHandler(getIncentiveBalance)
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
router.get('/v1/consent/:tokenId/status', authenticateApiKey, handlers.getConsentStatus);
router.get('/v1/consent/active', authenticateApiKey, handlers.listActiveConsents);
router.get('/v1/consent/withdrawn', authenticateApiKey, handlers.listWithdrawnConsents);
router.get('/v1/consent/:tokenId/:serialNumber/history', authenticateApiKey, handlers.getConsentHistory);
router.post('/v1/incentive/send', authenticateApiKey, handlers.sendIncentiveTokens);
router.post('/v1/incentive/redeem', authenticateApiKey, handlers.createRedeemTokenTransaction);
router.post('/v1/incentive/redeem/submit', authenticateApiKey, handlers.submitRedeemTransaction);
router.get('/v1/incentive/balance/:accountId', authenticateApiKey, handlers.getIncentiveBalance);

export default router;