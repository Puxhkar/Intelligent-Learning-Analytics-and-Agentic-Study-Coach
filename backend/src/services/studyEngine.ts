import { getGeminiResponse } from './gemini';

export const studyEngine = {
  generateStudyPlan: async (topic: string, goals: string[]) => {
    const prompt = `Generate a structured study plan for the topic: ${topic}. 
    Goals: ${goals.join(', ')}. 
    Format the response as a schedule with days and specific tasks.`;
    
    const rawPlan = await getGeminiResponse(prompt);
    
    // In a real app, we might parse this into a structured object
    return {
      topic,
      plan: rawPlan,
      suggestedResources: ['Resource 1', 'Resource 2'],
      timestamp: new Date().toISOString()
    };
  }
};
