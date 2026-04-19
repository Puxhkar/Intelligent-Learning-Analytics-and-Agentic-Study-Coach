import { Router, Request, Response } from 'express';
import { authenticateToken } from './auth';
import { StudyPlan } from './types';
import { studyEngine } from './services/studyEngine';

const router = Router();

router.post('/generate-plan', authenticateToken, async (req: Request, res: Response) => {
  const plan: StudyPlan = req.body;
  
  try {
    console.log(`Generating study plan for: ${plan.topic}`);
    const results = await studyEngine.generateStudyPlan(plan.topic, plan.goals);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error generating study plan', error });
  }
});

export default router;
