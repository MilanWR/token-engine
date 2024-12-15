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

// Cast controller functions to RequestHandler to fix TypeScript errors
const handlers = {
    createUser: createUser as RequestHandler,
    submitTokenAssociation: submitTokenAssociation as RequestHandler,
    createConsent: createConsent as RequestHandler,
    createWithdrawConsentTransaction: createWithdrawConsentTransaction as RequestHandler,
    submitWithdrawConsent: submitWithdrawConsent as RequestHandler,
    createDataCapture: createDataCapture as RequestHandler,
    verifyDataCapture: verifyDataCapture as RequestHandler,
    listDataCaptures: listDataCaptures as RequestHandler,
    getConsentStatus: getConsentStatus as RequestHandler,
    listActiveConsents: listActiveConsents as RequestHandler,
    listWithdrawnConsents: listWithdrawnConsents as RequestHandler,
    getConsentHistory: getConsentHistory as RequestHandler,
    sendIncentiveTokens: sendIncentiveTokens as RequestHandler,
    createRedeemTokenTransaction: createRedeemTokenTransaction as RequestHandler,
    submitRedeemTransaction: submitRedeemTransaction as RequestHandler,
    getIncentiveBalance: getIncentiveBalance as RequestHandler
};

// Routes with correct middleware name
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