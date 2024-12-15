import express, { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { register, login } from '../controllers/authController';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import prisma from '../config/database';

const router = Router();

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res.status(403).json({ error: `Invalid token: ${error.message}` });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      res.status(401).json({ error: 'API key is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { apiKey: apiKey as string }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        // Your registration logic
        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        // Your login logic
        res.status(200).json({ token: 'your-token' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router; 