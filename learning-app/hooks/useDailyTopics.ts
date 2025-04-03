import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/auth';
import { DailyTopic } from '../types';

export function useDailyTopics() {
  const { session } = useAuth();
  const [dailyTopic, setDailyTopic] = useState<DailyTopic | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadDailyTopic();
    }
  }, [session]);

  async function loadDailyTopic() {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_topics')
        .select('*')
        .eq('user_id', session?.user.id)
        .eq('scheduled_for', today)
        .eq('completed', false)
        .order('created_at')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setDailyTopic(data);
    } catch (error) {
      console.error('Error loading daily topic:', error);
    } finally {
      setLoading(false);
    }
  }

  async function completeTopic(feedback?: string, rating?: number) {
    if (!dailyTopic || !session?.user) return;

    try {
      const { error } = await supabase
        .from('daily_topics')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString(),
          feedback,
          difficulty_rating: rating
        })
        .eq('id', dailyTopic.id);

      if (error) throw error;
      await loadDailyTopic();
    } catch (error) {
      console.error('Error completing topic:', error);
      throw error;
    }
  }

  return {
    dailyTopic,
    completeTopic,
    loading,
    refresh: loadDailyTopic
  };
} 