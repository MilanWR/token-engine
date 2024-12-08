import express from 'express';
import { authenticateApiKey } from '../middleware/auth';
import { createUser, 
    submitTokenAssociation, 
    createConsent , 
    createWithdrawConsentTransaction, 
    submitWithdrawConsent, 
    createDataCapture, 
    verifyDataCapture, 
    listDataCaptures,
    listWithdrawnConsents,
    listActiveConsents,
    getConsentStatus,
    getConsentHistory
} from '../controllers/apiController';

const router = express.Router();

// Routes with correct middleware name
router.post('/v1/users', authenticateApiKey, createUser);
router.post('/v1/users/token-association', authenticateApiKey, submitTokenAssociation);
router.post('/v1/consent', authenticateApiKey, createConsent);
router.post('/v1/consent/withdraw', authenticateApiKey, createWithdrawConsentTransaction);
router.post('/v1/consent/withdraw/submit', authenticateApiKey, submitWithdrawConsent);
router.post('/v1/data-capture', authenticateApiKey, createDataCapture);
router.get('/v1/data-capture/verify/:accountId/:serialNumber', authenticateApiKey, verifyDataCapture);
router.get('/v1/data-capture/list', authenticateApiKey, listDataCaptures);
router.get('/v1/consent/:tokenId/:serialNumber/status', authenticateApiKey, getConsentStatus);
router.get('/v1/consent/active', authenticateApiKey, listActiveConsents);
router.get('/v1/consent/withdrawn', authenticateApiKey, listWithdrawnConsents);
router.get('/v1/consent/:tokenId/:serialNumber/history', authenticateApiKey, getConsentHistory);


export default router;