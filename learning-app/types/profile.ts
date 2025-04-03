export interface Profile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  class: string | null;
  learning_goal: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
} 