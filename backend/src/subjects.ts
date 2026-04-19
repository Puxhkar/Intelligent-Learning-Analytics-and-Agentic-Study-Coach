import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from './auth';
import { AuthRequest } from './types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

interface Subject {
  id: string;
  userId: string;
  name: string;
  description: string;
  accent: string;
  createdAt: string;
}

interface SubjectFile {
  id: string;
  subjectId: string;
  fileName: string;
  mimeType: string;
  summary: string;
  chunkCount: number;
  pageCount: number | null;
  byteSize: number;
  lastIngestedAt: string | null;
  text: string;
}

const subjects: Subject[] = [];
const files: SubjectFile[] = [];

const ACCENTS = ['yellow', 'blue', 'cream'];
const MAX_SUBJECTS = 3;

function getUserId(req: Request): string {
  return (req as AuthRequest).user?.id ?? 'anonymous';
}

function subjectView(subject: Subject) {
  const count = files.filter((f) => f.subjectId === subject.id).length;
  return {
    id: subject.id,
    name: subject.name,
    description: subject.description,
    accent: subject.accent,
    fileCount: count
  };
}

function fileView(file: SubjectFile) {
  return {
    id: file.id,
    fileName: file.fileName,
    mimeType: file.mimeType,
    summary: file.summary,
    chunkCount: file.chunkCount,
    pageCount: file.pageCount,
    byteSize: file.byteSize,
    lastIngestedAt: file.lastIngestedAt
  };
}

function chunkText(text: string, size = 800): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks: string[] = [];
  for (let i = 0; i < clean.length; i += size) {
    chunks.push(clean.slice(i, i + size));
  }
  return chunks;
}

async function extractText(buffer: Buffer, mimeType: string, fileName: string): Promise<{ text: string; pages: number | null }> {
  const lower = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  if (lower.includes('pdf') || name.endsWith('.pdf')) {
    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse: (data: Buffer) => Promise<{ text: string; numpages: number }> =
        (pdfParseModule as any).default ?? (pdfParseModule as any);
      const result = await pdfParse(buffer);
      return { text: result.text ?? '', pages: result.numpages ?? null };
    } catch (err) {
      console.error('PDF parse failed', err);
      return { text: buffer.toString('utf8'), pages: null };
    }
  }
  return { text: buffer.toString('utf8'), pages: null };
}

function buildSummary(text: string, fileName: string): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return `Uploaded ${fileName} (no extractable text).`;
  const snippet = trimmed.slice(0, 240);
  return `${snippet}${trimmed.length > 240 ? '…' : ''}`;
}

router.get('/', authenticateToken, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const mine = subjects.filter((s) => s.userId === userId).map(subjectView);
  res.json({ subjects: mine });
});

router.post('/', authenticateToken, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { name, description } = req.body ?? {};
  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const mine = subjects.filter((s) => s.userId === userId);
  if (mine.length >= MAX_SUBJECTS) {
    res.status(400).json({ error: `You can have at most ${MAX_SUBJECTS} subjects.` });
    return;
  }
  const subject: Subject = {
    id: `subject_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    name: name.trim(),
    description: (description ?? '').toString().trim(),
    accent: ACCENTS[mine.length % ACCENTS.length],
    createdAt: new Date().toISOString()
  };
  subjects.push(subject);
  res.status(201).json({ subject: subjectView(subject) });
});

router.get('/:id/files', authenticateToken, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const subject = subjects.find((s) => s.id === req.params.id && s.userId === userId);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }
  const mine = files.filter((f) => f.subjectId === subject.id).map(fileView);
  res.json({ files: mine });
});

router.post('/:id/files', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const subject = subjects.find((s) => s.id === req.params.id && s.userId === userId);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }
  const uploaded = (req as Request & { file?: Express.Multer.File }).file;
  if (!uploaded) {
    res.status(400).json({ error: 'file is required' });
    return;
  }

  const { text, pages } = await extractText(uploaded.buffer, uploaded.mimetype, uploaded.originalname);
  const chunks = chunkText(text);
  const file: SubjectFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    subjectId: subject.id,
    fileName: uploaded.originalname,
    mimeType: uploaded.mimetype || 'application/octet-stream',
    summary: buildSummary(text, uploaded.originalname),
    chunkCount: chunks.length,
    pageCount: pages,
    byteSize: uploaded.size,
    lastIngestedAt: new Date().toISOString(),
    text
  };
  files.push(file);

  res.status(201).json({
    ingestion: {
      fileName: file.fileName,
      totalPages: file.pageCount,
      chunkCount: file.chunkCount,
      summary: file.summary
    }
  });
});

router.post('/:id/quiz', authenticateToken, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const subject = subjects.find((s) => s.id === req.params.id && s.userId === userId);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }
  const subjectFiles = files.filter((f) => f.subjectId === subject.id);
  const corpus = subjectFiles.map((f) => f.text).join(' ').replace(/\s+/g, ' ').trim();

  if (!corpus) {
    res.status(400).json({ error: 'Upload at least one note before generating a quiz.' });
    return;
  }

  const sentences = corpus
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(' ').length >= 6)
    .slice(0, 10);

  const mcqs = sentences.slice(0, 4).map((sentence, idx) => {
    const words = sentence.split(' ').filter((w) => w.length > 4);
    const keyword = words[Math.floor(words.length / 2)] ?? sentence.split(' ')[0] ?? 'concept';
    const question = sentence.replace(keyword, '______');
    const distractors = ['context', 'framework', 'analysis'].filter((d) => d !== keyword.toLowerCase());
    const options = [keyword, ...distractors].slice(0, 4);
    return {
      id: `mcq_${idx}_${Date.now()}`,
      question: `Fill in the blank: ${question}`,
      options,
      correctIndex: 0,
      explanation: `The original note reads: "${sentence}"`,
      citation: subjectFiles[0]?.fileName ?? 'notes'
    };
  });

  const shortAnswers = sentences.slice(4, 7).map((sentence, idx) => ({
    id: `sa_${idx}_${Date.now()}`,
    question: `Explain in your own words: ${sentence.slice(0, 100)}${sentence.length > 100 ? '…' : ''}`,
    modelAnswer: sentence,
    citation: subjectFiles[0]?.fileName ?? 'notes'
  }));

  res.json({ quiz: { mcqs, shortAnswers } });
});

export const askRouter = Router();

askRouter.post('/', authenticateToken, (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { subjectId, question } = req.body ?? {};
  if (!subjectId || !question) {
    res.status(400).json({ error: 'subjectId and question are required' });
    return;
  }
  const subject = subjects.find((s) => s.id === subjectId && s.userId === userId);
  if (!subject) {
    res.status(404).json({ error: 'Subject not found' });
    return;
  }
  const subjectFiles = files.filter((f) => f.subjectId === subject.id);
  if (subjectFiles.length === 0) {
    res.json({
      found: false,
      answer: 'No notes have been uploaded for this subject yet. Upload a PDF or text file and try again.',
      confidence: 'low',
      evidence: [],
      citations: []
    });
    return;
  }

  const q = String(question).toLowerCase();
  const keywords = q.split(/\W+/).filter((w) => w.length > 3);
  const scored = subjectFiles
    .map((file) => {
      const chunks = chunkText(file.text);
      const ranked = chunks
        .map((chunk, idx) => {
          const lc = chunk.toLowerCase();
          const score = keywords.reduce((sum, kw) => sum + (lc.includes(kw) ? 1 : 0), 0);
          return { chunk, idx, score, file };
        })
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score);
      return ranked.slice(0, 2);
    })
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scored.length === 0) {
    res.json({
      found: false,
      answer: `I could not find anything in the uploaded notes that matches "${question}". Try rephrasing or uploading more material.`,
      confidence: 'low',
      evidence: [],
      citations: []
    });
    return;
  }

  const evidence = scored.map((s) => s.chunk.slice(0, 280));
  const citations = scored.map((s) => ({
    fileName: s.file.fileName,
    page: null,
    chunkId: `${s.file.id}:${s.idx}`
  }));

  const answer = `Based on the uploaded notes: ${evidence[0]}${evidence[0].length >= 280 ? '…' : ''}`;
  const confidence = scored[0].score >= 3 ? 'high' : scored[0].score >= 2 ? 'medium' : 'low';

  res.json({ found: true, answer, confidence, evidence, citations });
});

export default router;
