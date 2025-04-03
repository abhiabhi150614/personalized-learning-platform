import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/auth';
import { generateDailyTopics, scheduleDailyTopics } from '../services/topics';
import { Milestone } from '../types';

export function useCareerPath() {
  const { session } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadMilestones();
    }
  }, [session]);

  async function loadMilestones() {
    try {
      setLoading(true);
      const { data: careerPath } = await supabase
        .from('career_paths')
        .select('id')
        .eq('user_id', session?.user.id)
        .single();

      if (careerPath) {
        const { data, error } = await supabase
          .from('career_milestones')
          .select('*')
          .eq('career_path_id', careerPath.id)
          .order('order_index');

        if (error) throw error;
        setMilestones(data);
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function startMilestone(milestone: Milestone) {
    try {
      const months = parseInt(milestone.timeline) || 3;
      const totalDays = months * 30;
      const topics = await generateDailyTopics(milestone, totalDays);
      
      // Schedule topics and get first topic
      const { data: firstTopic } = await scheduleDailyTopics(
        session?.user.id, 
        milestone.id, 
        topics
      );

      await supabase
        .from('career_milestones')
        .update({ 
          status: 'in_progress',
          current_topic_id: firstTopic.id
        })
        .eq('id', milestone.id);

      await loadMilestones();
      return firstTopic;
    } catch (error) {
      console.error('Error starting milestone:', error);
      throw error;
    }
  }

  return {
    milestones,
    loading,
    startMilestone,
    refresh: loadMilestones
  };
} 