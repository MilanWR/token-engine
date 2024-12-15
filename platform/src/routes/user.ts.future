import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Basic user profile route
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Profile route - to be implemented' });
});

export default router; 