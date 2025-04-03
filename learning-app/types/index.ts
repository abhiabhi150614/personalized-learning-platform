export interface DailyTopic {
  id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  completed: boolean;
  completed_at?: string;
  feedback?: string;
  difficulty_rating?: number;
  skills_covered: string[];
  prerequisites: string[];
  resources: string[];
  practice_tasks: string[];
  milestone_id: string;
  user_id: string;
  scheduled_for: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  timeline: string;
  skills_required: string[];
  resources: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  current_topic_id: string | null;
  career_path_id: string;
  order_index: number;
} 