import express from 'express';
import { authenticateApiKey } from '../middleware/auth';
import { createUser, submitTokenAssociation, createConsent , createWithdrawConsentTransaction, submitWithdrawConsent} from '../controllers/apiController';

const router = express.Router();

// Routes with correct middleware name
router.post('/users', authenticateApiKey, createUser);
router.post('/users/token-association', authenticateApiKey, submitTokenAssociation);
router.post('/consent', authenticateApiKey, createConsent);
router.post('/consent/withdraw', authenticateApiKey, createWithdrawConsentTransaction);
router.post('/consent/withdraw/submit', authenticateApiKey, submitWithdrawConsent);

export default router;