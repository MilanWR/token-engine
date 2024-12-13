import { Request, Response } from 'express';
import prisma from '../config/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const PLAN_PRICES = {
  BASIC: 'price_basic_id', // Replace with actual Stripe price IDs
  PREMIUM: 'price_premium_id',
  ENTERPRISE: 'price_enterprise_id',
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;
    const { planType } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or update Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: PLAN_PRICES[planType as keyof typeof PLAN_PRICES] }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Update database
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        planType,
        stripeCustomerId,
        isActive: true,
      },
      create: {
        userId: user.id,
        planType,
        stripeCustomerId,
        isActive: true,
      },
    });

    res.json({ 
      clientSecret: (subscription.latest_invoice as any).payment_intent.client_secret,
      subscriptionId: subscription.id 
    });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Error creating subscription' });
  }
};

export const getSubscriptionDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching subscription details' });
  }
}; 