import express from 'express';
import { authenticateApiKey } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { trackApiUsage } from '../controllers/usageController';
import { analyzeSentiment, countWords } from '../controllers/apiController';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
    console.log('API Route hit:', req.path);
    next();
});

// Apply middleware to all API routes
router.use(authenticateApiKey);
console.log('After auth middleware setup');

router.use(rateLimiter);
console.log('After rate limiter setup');

router.use(trackApiUsage);
console.log('After usage tracker setup');

// API endpoints
router.post('/v1/analyze-sentiment', (req, res, next) => {
    console.log('Sentiment analysis endpoint hit');
    analyzeSentiment(req, res);
});

router.post('/v1/count-words', (req, res, next) => {
    console.log('Word count endpoint hit');
    countWords(req, res);
});

export default router; 