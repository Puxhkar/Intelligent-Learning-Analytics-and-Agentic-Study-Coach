import { getGeminiResponse } from './gemini';
import { discoverSources } from './sourceDiscovery';

export const researchEngine = {
  performResearch: async (topic: string, depth: string) => {
    const prompt = `Perform a ${depth} research on the following topic: ${topic}. Provide a comprehensive summary and key takeaways.`;
    
    const summary = await getGeminiResponse(prompt);
    const sources = await discoverSources(topic);
    
    return {
      topic,
      summary,
      sources: sources.map(s => s.url),
      timestamp: new Date().toISOString()
    };
  }
};
