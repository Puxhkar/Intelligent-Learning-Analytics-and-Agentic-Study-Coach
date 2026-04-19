import type { Request } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface ResearchQuery {
  topic: string;
  depth: 'quick' | 'deep';
  options?: any;
}

export interface StudyPlan {
  topic: string;
  duration: string;
  goals: string[];
}

export interface AIAssistantResponse {
  content: string;
  sources?: string[];
  suggestedFollowups?: string[];
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  relevanceScore: number;
}
