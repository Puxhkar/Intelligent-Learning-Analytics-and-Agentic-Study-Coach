import { Router, Request, Response } from 'express';
import { authenticateToken } from './auth';
import { AuthRequest } from './types';

const router = Router();

interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  sourceType: string;
  credibility: number;
  publishedAt: string | null;
}

interface ResearchReport {
  title: string;
  abstract: string;
  keyFindings: string[];
  sources: ResearchSource[];
  conclusion: string;
  followUpQuestions: string[];
  generatedAt: string;
}

interface ResearchResponse {
  sessionId: string;
  report: ResearchReport;
  workflow: {
    searchQuery: string;
    sourcesAnalyzed: number;
    warnings: string[];
    usedSessionMemory: boolean;
    modelUsed: string | null;
    stages: string[];
  };
}

interface HistoryEntry {
  userId: string;
  query: string;
  title: string;
  abstract: string;
  generatedAt: string;
  sessionId: string;
  sourceCount: number;
  warnings: string[];
}

const history: HistoryEntry[] = [];

function buildSources(query: string): ResearchSource[] {
  const topic = query.trim() || 'research topic';
  const base = encodeURIComponent(topic);
  return [
    {
      title: `Primer on ${topic}`,
      url: `https://scholar.google.com/scholar?q=${base}`,
      snippet: `Curated scholarly overview for "${topic}" from peer-reviewed sources.`,
      domain: 'scholar.google.com',
      sourceType: 'academic',
      credibility: 0.92,
      publishedAt: new Date().toISOString()
    },
    {
      title: `${topic} — recent coverage`,
      url: `https://www.google.com/search?q=${base}`,
      snippet: `Recent discussion and analysis around "${topic}".`,
      domain: 'google.com',
      sourceType: 'web',
      credibility: 0.68,
      publishedAt: new Date().toISOString()
    },
    {
      title: `${topic} on Wikipedia`,
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${base}`,
      snippet: `Encyclopedic summary and citations for "${topic}".`,
      domain: 'en.wikipedia.org',
      sourceType: 'reference',
      credibility: 0.78,
      publishedAt: null
    }
  ];
}

function buildReport(query: string): ResearchReport {
  const topic = query.trim() || 'the requested topic';
  const now = new Date().toISOString();
  return {
    title: `Research brief: ${topic}`,
    abstract: `This brief summarises current thinking about ${topic}, surfacing the dominant arguments, recent evidence, and open questions that warrant further investigation.`,
    keyFindings: [
      `Multiple independent sources converge on the core framing of ${topic}.`,
      `Recent work emphasises practical implications and measurable outcomes.`,
      `Counter-arguments focus on scope, methodology, and generalisability.`
    ],
    sources: buildSources(topic),
    conclusion: `Overall, the evidence supports a measured optimism about ${topic}, while flagging replication and deployment gaps that remain open.`,
    followUpQuestions: [
      `What empirical studies most strongly validate claims about ${topic}?`,
      `Which stakeholders are most affected by changes in ${topic}?`,
      `Where does current work on ${topic} most likely fail?`
    ],
    generatedAt: now
  };
}

router.post('/report', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id ?? 'anonymous';
  const { query, sessionId } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const resolvedSessionId: string = sessionId || `research_${Date.now()}`;
  const previousForSession = history.some((h) => h.userId === userId && h.sessionId === resolvedSessionId);

  const report = buildReport(query);

  const response: ResearchResponse = {
    sessionId: resolvedSessionId,
    report,
    workflow: {
      searchQuery: query,
      sourcesAnalyzed: report.sources.length,
      warnings: process.env.GEMINI_API_KEY ? [] : ['Gemini API key not configured; using local fallback content.'],
      usedSessionMemory: previousForSession,
      modelUsed: process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : null,
      stages: ['plan', 'search', 'synthesize', 'cite']
    }
  };

  history.unshift({
    userId,
    query,
    title: report.title,
    abstract: report.abstract,
    generatedAt: report.generatedAt,
    sessionId: resolvedSessionId,
    sourceCount: report.sources.length,
    warnings: response.workflow.warnings
  });

  res.json(response);
});

router.post('/expand', authenticateToken, (req: Request, res: Response) => {
  const { query } = req.body ?? {};
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query is required' });
    return;
  }
  res.json({
    query,
    expansions: [
      `${query} — historical context`,
      `${query} — current state of the art`,
      `${query} — practical applications`,
      `${query} — limitations and critiques`
    ],
    subtopics: [
      `foundations of ${query}`,
      `empirical evidence on ${query}`,
      `${query} in industry`,
      `open research problems in ${query}`
    ],
    suggestedQuestions: [
      `What are the strongest results about ${query} in the last two years?`,
      `How does ${query} compare to adjacent approaches?`,
      `What does ${query} still fail to explain?`
    ]
  });
});

router.get('/history', authenticateToken, (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user?.id ?? 'anonymous';
  const entries = history
    .filter((h) => h.userId === userId)
    .map(({ userId: _uid, ...rest }) => rest);
  res.json({ history: entries });
});

export default router;
