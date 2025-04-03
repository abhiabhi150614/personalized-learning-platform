import { GoogleGenerativeAI } from '@google/generative-ai';

// Replace this API key with yours
const genAI = new GoogleGenerativeAI('AIzaSyDMmIyy9SANKCnLLBy78sJuD6tX9AVNn-c');

export async function getAIResponse(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });

    // Add a system prompt to guide the AI
    const fullPrompt = `You are an AI study assistant helping students learn. 
    Please provide clear, concise, and helpful answers.
    
    Student Question: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('AI Assistant Error:', error);
    throw new Error('Failed to get AI response. Please try again.');
  }
}