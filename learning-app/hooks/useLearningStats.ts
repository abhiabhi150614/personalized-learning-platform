import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/auth';

interface LearningStats {
  coursesCompleted: number;
  totalMinutesLearned: number;
  currentStreak: number;
}

export function useLearningStats() {
  const { session } = useAuth();
  const [stats, setStats] = useState<LearningStats>({
    coursesCompleted: 0,
    totalMinutesLearned: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadLearningStats();
    }
  }, [session]);

  async function loadLearningStats() {
    try {
      setLoading(true);

      // Get completed courses count
      const { data: coursesData, error: coursesError } = await supabase
        .rpc('calculate_courses_completed', {
          user_id: session.user.id
        });

      if (coursesError) throw coursesError;

      // Get total minutes learned
      const { data: minutesData, error: minutesError } = await supabase
        .rpc('calculate_total_minutes', {
          user_id: session.user.id
        });

      if (minutesError) throw minutesError;

      // Get current streak
      const { data: streakData, error: streakError } = await supabase
        .rpc('calculate_current_streak', {
          user_id: session.user.id
        });

      if (streakError) throw streakError;

      setStats({
        coursesCompleted: coursesData || 0,
        totalMinutesLearned: minutesData || 0,
        currentStreak: streakData || 0
      });

    } catch (error) {
      console.error('Error loading learning stats:', error);
      // Set default values if error occurs
      setStats({
        coursesCompleted: 0,
        totalMinutesLearned: 0,
        currentStreak: 0
      });
    } finally {
      setLoading(false);
    }
  }

  return {
    stats,
    loading,
    refreshStats: loadLearningStats
  };
} 