import express, { Router } from 'express';
import { Request, Response } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

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