import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from './types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export const users: StoredUser[] = [];

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.sendStatus(403);
      return;
    }
    (req as AuthRequest).user = user;
    next();
  });
};

function publicUser(user: StoredUser) {
  return { id: user.id, email: user.email, name: user.name };
}

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    res.status(400).json({ error: 'name, email and password are required' });
    return;
  }
  if (users.some((u) => u.email === email)) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user: StoredUser = { id: Date.now().toString(), email, name, password: hashedPassword };
  users.push(user);

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
  res.status(201).json({ user: publicUser(user), session: { token } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }
  const user = users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
  res.json({ user: publicUser(user), session: { token } });
});

router.get('/me', authenticateToken, (req: Request, res: Response) => {
  const current = (req as AuthRequest).user;
  if (!current) {
    res.sendStatus(401);
    return;
  }
  res.json({ user: { id: current.id, email: current.email, name: current.name } });
});

router.post('/logout', authenticateToken, (_req: Request, res: Response) => {
  res.status(204).end();
});

export default router;
