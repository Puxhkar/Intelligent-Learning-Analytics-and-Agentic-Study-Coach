import { Router, Response } from 'express';
import { authenticateToken } from './auth';
import { AuthRequest, ResearchQuery } from './types';
import { researchEngine } from './services/researchEngine';

const router = Router();

router.post('/query', authenticateToken, async (req: AuthRequest, res: Response) => {
  const query: ResearchQuery = req.body;
  
  try {
    console.log(`Processing research query: ${query.topic} (${query.depth})`);
    const results = await researchEngine.performResearch(query.topic, query.depth);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error processing research query', error });
  }
});

export default router;
