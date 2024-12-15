import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

const ENDPOINT_COSTS = {
  '/api/v1/analyze-sentiment': 0.001,
  '/api/v1/count-words': 0.002,
};

export const trackApiUsage = async (req: Request, res: Response, next: NextFunction) => {
  console.log('Starting usage tracking');
  const startTime = Date.now();
  
  // Store the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const responseTime = Date.now() - startTime;
    console.log('Tracking API usage - response time:', responseTime);
    
    try {
      const { user } = req as any;
      const endpoint = req.path;
      const statusCode = res.statusCode;
      const cost = ENDPOINT_COSTS[endpoint as keyof typeof ENDPOINT_COSTS] || 0;

      prisma.apiUsage.create({
        data: {
          userId: user.id,
          endpoint,
          responseTime,
          statusCode,
          cost,
        },
      }).then(() => {
        console.log('Usage tracked successfully');
      }).catch((error) => {
        console.error('Error tracking usage:', error);
      });

    } catch (error) {
      console.error('Error in usage tracking:', error);
    }

    // Call the original end function
    originalEnd.call(res, chunk, encoding, cb);
  };

  next();
};

export const getUsageStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const { startDate, endDate } = req.query;

    const usage = await prisma.apiUsage.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate ? new Date(startDate as string) : undefined,
          lte: endDate ? new Date(endDate as string) : undefined,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const totalCost = usage.reduce((sum: number, record: any) => sum + record.cost, 0);
    const totalCalls = usage.length;

    res.json({
      usage,
      summary: {
        totalCost,
        totalCalls,
        averageCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching usage statistics' });
  }
}; 