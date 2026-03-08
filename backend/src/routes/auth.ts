import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-random-secret';

function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const user = await User.create({ email, password });
    const token = generateToken(user._id.toString());
    res.status(201).json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user._id.toString());
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
