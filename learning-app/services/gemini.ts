import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDGDc2OpK_qVi8DWVTGBH2qRo_1U88uORo");

export async function generateCareerPathWithGemini(profile: any) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-002" });

    const prompt = `
      As an expert career advisor, create a personalized learning path for a ${profile.class} student interested in ${profile.learning_goal}.
      
      Create a detailed career development path with 4-5 milestones that will help achieve this goal.
      Each milestone should:
      1. Build progressively on previous knowledge
      2. Include specific skills to learn
      3. Have realistic timelines
      4. Include relevant learning resources
      
      Return ONLY a JSON array with this exact structure:
      [{
        "title": "Clear milestone title",
        "description": "Detailed description of what to learn",
        "timeline": "Duration in months (e.g., '3 months')",
        "skills_required": ["Array of specific skills"],
        "resources": ["Array of learning resources"],
        "order_index": 0
      }]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean the response
    text = text.replace(/```json\s*/g, '')
               .replace(/```\s*/g, '')
               .replace(/^\s*\[\s*/m, '[')
               .replace(/\s*\]\s*$/m, ']')
               .trim();

    try {
      const milestones = JSON.parse(text);
      
      if (!Array.isArray(milestones)) {
        throw new Error('Response is not an array');
      }

      return milestones.map((milestone: any, index: number) => ({
        title: String(milestone.title || `Phase ${index + 1}`),
        description: String(milestone.description || 'No description provided'),
        timeline: String(milestone.timeline || '3 months'),
        skills_required: Array.isArray(milestone.skills_required) 
          ? milestone.skills_required.map(String)
          : ['Skill to be determined'],
        resources: Array.isArray(milestone.resources) 
          ? milestone.resources.map(String)
          : ['Resources to be determined'],
        order_index: index
      }));

    } catch (parseError) {
      console.error('Parse Error:', parseError);
      throw new Error('Failed to generate career path structure');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
} 