import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'fake-key'
});

export const upsertDocument = async (id: string, values: number[], metadata: any) => {
  const index = pc.index(process.env.PINECONE_INDEX || 'study-coach');
  await index.upsert({ records: [{ id, values, metadata }] } as any);
};

export const queryKnowledgeBase = async (vector: number[], topK: number = 5) => {
  const index = pc.index(process.env.PINECONE_INDEX || 'study-coach');
  const results = await index.query({ vector, topK, includeMetadata: true });
  return results.matches;
};
