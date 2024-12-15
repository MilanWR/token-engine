import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createSubscription, getSubscriptionDetails } from '../controllers/subscriptionController';

const router = express.Router();

router.post('/create', authenticateToken, createSubscription);
router.get('/details', authenticateToken, getSubscriptionDetails);

export default router; 