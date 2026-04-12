import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest, User } from './types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Mock DB for demonstration
const users: any[] = [];

// Auth Middleware
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = { id: Date.now().toString(), email, password: hashedPassword, name };
  users.push(user);
  
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default router;
