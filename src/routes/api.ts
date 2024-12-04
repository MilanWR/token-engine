import express from 'express';
import { authenticateApiKey } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { trackApiUsage } from '../controllers/usageController';
import { createUser, submitTokenAssociation } from '../controllers/apiController';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log('API Route hit:', {
        path: req.path,
        method: req.method,
        headers: req.headers
    });
    next();
});

// API endpoints
router.post('/v1/users', authenticateApiKey, rateLimiter, trackApiUsage, createUser);
router.post('/v1/users/token-association', authenticateApiKey, rateLimiter, trackApiUsage, submitTokenAssociation);

export default router; 