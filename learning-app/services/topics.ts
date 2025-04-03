import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from './supabase';

const genAI = new GoogleGenerativeAI("AIzaSyDGDc2OpK_qVi8DWVTGBH2qRo_1U88uORo");

function calculateTotalHours(timeline: string): number {
  const months = parseInt(timeline) || 3;
  return months * 30; // 1 hour per day minimum
}

export async function generateDailyTopics(milestone: any, totalDays: number) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const totalHours = calculateTotalHours(milestone.timeline);

    const prompt = `
      You are an expert curriculum designer. Create a detailed learning path for:
      Milestone: "${milestone.title}"
      Description: "${milestone.description}"
      Required Skills: ${milestone.skills_required.join(', ')}
      Total Learning Hours Required: ${totalHours} hours

      Create a series of ${totalDays} daily learning sessions that:
      1. Total approximately ${totalHours} hours of learning time
      2. Build progressively from basics to advanced concepts
      3. Include hands-on practice and exercises
      4. Cover all required skills systematically

      Return ONLY a valid JSON array with no line breaks in strings. Format:
      [{"title": "Topic Title", "description": "Description", "estimated_minutes": 60, "skills_covered": ["skill1"], "prerequisites": ["prereq1"], "resources": ["resource1"], "practice_tasks": ["task1"]}]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean the response text
    text = text.replace(/```json\s*/g, '')
               .replace(/```\s*/g, '')
               .replace(/\[\s+/g, '[')
               .replace(/\s+\]/g, ']')
               .replace(/\s+{/g, '{')
               .replace(/}\s+/g, '}')
               .replace(/,\s+"/g, ',"')
               .replace(/"\s+:/g, '":')
               .replace(/:\s+"/g, ':"')
               .replace(/:\s+\[/g, ':[')
               .replace(/\]\s+,/g, '],')
               .replace(/\[\s+"/g, '["')
               .replace(/"\s+\]/g, '"]')
               .replace(/\[\s+{/g, '[{')
               .replace(/}\s+\]/g, '}]')
               .trim();

    try {
      const topics = JSON.parse(text);

      if (!Array.isArray(topics)) {
        throw new Error('Response is not an array');
      }

      return topics.map((topic: any, index: number) => ({
        title: String(topic.title || `Day ${index + 1}: ${milestone.title} Session`),
        description: formatDescription(topic),
        estimated_minutes: calculateMinutes(topic.estimated_minutes, totalHours, totalDays),
        skills_covered: topic.skills_covered || milestone.skills_required,
        prerequisites: topic.prerequisites || [],
        resources: topic.resources || milestone.resources,
        practice_tasks: topic.practice_tasks || [],
        order_index: index
      }));

    } catch (parseError) {
      console.error('Parse Error:', parseError);
      return generateFallbackTopics(milestone, totalDays, totalHours);
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    return generateFallbackTopics(milestone, totalDays, calculateTotalHours(milestone.timeline));
  }
}

function formatDescription(topic: any): string {
  const parts = [];
  
  parts.push(String(topic.description || ''));
  
  if (topic.practice_tasks?.length) {
    parts.push('\n\nPractice Tasks:');
    topic.practice_tasks.forEach((task: string) => parts.push(`• ${task}`));
  }
  
  if (topic.prerequisites?.length) {
    parts.push('\n\nPrerequisites:');
    topic.prerequisites.forEach((prereq: string) => parts.push(`• ${prereq}`));
  }

  return parts.join('\n');
}

function calculateMinutes(estimated: number, totalHours: number, totalDays: number): number {
  const minMinutesPerDay = (totalHours * 60) / totalDays;
  const provided = Number(estimated) || minMinutesPerDay;
  return Math.max(45, Math.min(120, provided));
}

function generateFallbackTopics(milestone: any, totalDays: number, totalHours: number) {
  const minutesPerDay = Math.ceil((totalHours * 60) / totalDays);
  const topics = [];

  // Generate topics for each skill
  for (let skillIndex = 0; skillIndex < milestone.skills_required.length; skillIndex++) {
    const skill = milestone.skills_required[skillIndex];
    const daysPerSkill = Math.ceil(totalDays / milestone.skills_required.length);
    
    for (let day = 0; day < daysPerSkill; day++) {
      topics.push({
        title: `${skill} - Day ${day + 1}`,
        description: generateProgressiveDescription(skill, day),
        estimated_minutes: minutesPerDay,
        skills_covered: [skill],
        prerequisites: day > 0 ? [`${skill} - Day ${day}`] : [],
        resources: milestone.resources,
        practice_tasks: [`Practice ${skill} concepts learned today`],
        order_index: topics.length
      });
    }
  }

  return topics.slice(0, totalDays);
}

function generateProgressiveDescription(skill: string, day: number): string {
  const levels = [
    `Introduction to ${skill}. Learn the fundamental concepts and basic principles.`,
    `Build upon your ${skill} knowledge with intermediate concepts and practical exercises.`,
    `Advanced ${skill} topics and real-world applications.`,
    `Master ${skill} through complex scenarios and project work.`
  ];

  const levelIndex = Math.min(day, levels.length - 1);
  return levels[levelIndex];
}

export async function scheduleDailyTopics(userId: string, milestoneId: string, topics: any[]) {
  const today = new Date();
  let previousTopicId = null;
  let firstTopicData = null;
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + i);
    
    const { data: insertedTopic, error } = await supabase
      .from('daily_topics')
      .insert({
        user_id: userId,
        milestone_id: milestoneId,
        title: topic.title,
        description: topic.description,
        estimated_minutes: topic.estimated_minutes,
        skills_covered: topic.skills_covered,
        prerequisites: topic.prerequisites,
        resources: topic.resources,
        practice_tasks: topic.practice_tasks,
        scheduled_for: scheduledDate.toISOString().split('T')[0],
        order_index: topic.order_index
      })
      .select()
      .single();

    if (error) throw error;

    if (previousTopicId) {
      await supabase
        .from('daily_topics')
        .update({ next_topic_id: insertedTopic.id })
        .eq('id', previousTopicId);
    }

    previousTopicId = insertedTopic.id;

    if (i === 0) {
      firstTopicData = insertedTopic;
    }
  }

  return { data: firstTopicData };
}

export async function getNextTopic(currentTopicId: string) {
  try {
    // Get current topic details
    const { data: currentTopic } = await supabase
      .from('daily_topics')
      .select('milestone_id, scheduled_for')
      .eq('id', currentTopicId)
      .single();

    if (!currentTopic) return null;

    // Get next scheduled topic for this milestone
    const { data: nextTopic } = await supabase
      .from('daily_topics')
      .select('*')
      .eq('milestone_id', currentTopic.milestone_id)
      .eq('completed', false)
      .gt('scheduled_for', currentTopic.scheduled_for)
      .order('scheduled_for')
      .limit(1)
      .single();

    return nextTopic;
  } catch (error) {
    console.error('Error getting next topic:', error);
    return null;
  }
}

export async function updateLearningStats(userId: string, minutesLearned: number) {
  try {
    // Update total minutes learned
    await supabase.rpc('increment_minutes_learned', {
      user_id: userId,
      minutes: minutesLearned
    });

    // Update streak
    await supabase.rpc('update_learning_streak', {
      user_id: userId
    });

    // Update courses completed count if needed
    await supabase.rpc('update_courses_completed', {
      user_id: userId
    });

  } catch (error) {
    console.error('Error updating learning stats:', error);
    throw error;
  }
} 