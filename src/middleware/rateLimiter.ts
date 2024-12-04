import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

const RATE_LIMITS = {
  FREE: { requestsPerMinute: 10 },
  BASIC: { requestsPerMinute: 60 },
  PREMIUM: { requestsPerMinute: 300 },
  ENTERPRISE: { requestsPerMinute: 1000 },
};

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req as any;
    
    // Get user with subscription
    const userWithSub = await prisma.user.findUnique({
      where: { id: user.id },
      include: { subscription: true }
    });

    if (!userWithSub) {
      return res.status(403).json({
        error: 'User not found'
      });
    }

    // If no subscription, assume FREE tier
    const planType = userWithSub.subscription?.planType || 'FREE';
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const recentRequests = await prisma.apiUsage.count({
      where: {
        userId: user.id,
        timestamp: {
          gte: oneMinuteAgo,
        },
      },
    });

    const limit = RATE_LIMITS[planType as keyof typeof RATE_LIMITS].requestsPerMinute;

    if (recentRequests >= limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        limit,
        resetTime: oneMinuteAgo.getTime() + 60000,
      });
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    res.status(500).json({ error: 'Error checking rate limit' });
  }
}; 