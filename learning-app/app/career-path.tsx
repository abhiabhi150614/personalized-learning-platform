import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Button, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/auth';
import { generateDailyTopics, scheduleDailyTopics } from '../services/topics';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { ProgressBar } from '../components/ProgressBar';

interface Milestone {
  id: string;
  title: string;
  description: string;
  timeline: string;
  skills_required: string[];
  resources: string[];
  completion_status: boolean;
  order_index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  current_topic_id: string | null;
  total_hours: number;
  total_topics: number;
  completed_topics: number;
}

export default function CareerPath() {
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

  async function toggleMilestone(milestone: Milestone) {
    try {
      const { error } = await supabase
        .from('career_milestones')
        .update({ completion_status: !milestone.completion_status })
        .eq('id', milestone.id);

      if (error) throw error;

      // Update local state
      setMilestones(prev => 
        prev.map(m => 
          m.id === milestone.id 
            ? { ...m, completion_status: !m.completion_status }
            : m
        )
      );
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  }

  async function handleStartMilestone(milestone: Milestone) {
    try {
      // Generate and schedule topics
      const months = parseInt(milestone.timeline) || 3;
      const totalDays = months * 30;
      const topics = await generateDailyTopics(milestone, totalDays);
      
      // Schedule topics and get the first topic ID
      const { data: firstTopic } = await scheduleDailyTopics(session.user.id, milestone.id, topics);

      // Update milestone status
      const { error: updateError } = await supabase
        .from('career_milestones')
        .update({ 
          status: 'in_progress',
          current_topic_id: firstTopic.id
        })
        .eq('id', milestone.id);

      if (updateError) throw updateError;

      Alert.alert(
        'Success',
        'Your learning journey has begun! Check your home page for today\'s topic.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/home') }]
      );

      // Refresh milestones
      loadMilestones();
    } catch (error) {
      console.error('Error starting milestone:', error);
      Alert.alert('Error', 'Failed to start milestone. Please try again.');
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Career Path',
          headerShown: true,
        }} 
      />
      <View style={styles.content}>
        <Text style={styles.title}>Your Learning Journey</Text>
        
        {milestones.map((milestone, index) => (
          <View 
            key={milestone.id}
            style={[
              styles.milestoneCard,
              milestone.status === 'completed' && styles.completedMilestone,
              milestone.status === 'in_progress' && styles.activeMilestone
            ]}
          >
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={[
                styles.statusBadge,
                { backgroundColor: milestone.status === 'completed' ? colors.success : colors.primary }
              ]}>
                {milestone.status === 'completed' ? 'Completed' : 'In Progress'}
              </Text>
            </View>
            
            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
            
            <View style={styles.progressSection}>
              <View style={styles.timeInfo}>
                <MaterialIcons name="access-time" size={20} color={colors.gray[600]} />
                <Text style={styles.timeText}>
                  {milestone.total_hours} hours ({milestone.timeline})
                </Text>
              </View>

              {(milestone.status === 'in_progress' || milestone.status === 'completed') && (
                <View style={styles.progressInfo}>
                  <ProgressBar 
                    progress={milestone.completed_topics / milestone.total_topics} 
                    style={styles.progressBar}
                  />
                  <Text style={styles.progressText}>
                    {milestone.completed_topics} of {milestone.total_topics} topics completed
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.skillsContainer}>
              <Text style={styles.sectionTitle}>Skills to Master:</Text>
              <View style={styles.skillsList}>
                {milestone.skills_required.map((skill, i) => (
                  <View key={i} style={styles.skillBadge}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {milestone.status === 'not_started' && index === 0 && (
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => handleStartMilestone(milestone)}
              >
                <MaterialIcons name="play-arrow" size={24} color={colors.background} />
                <Text style={styles.startButtonText}>Start Learning Journey</Text>
              </TouchableOpacity>
            )}
            
            {milestone.status === 'in_progress' && (
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={() => router.push('/(tabs)/home')}
              >
                <MaterialIcons name="arrow-forward" size={24} color={colors.background} />
                <Text style={styles.continueButtonText}>Continue Learning</Text>
              </TouchableOpacity>
            )}
            
            {milestone.status === 'not_started' && index > 0 && 
             milestones[index - 1].status !== 'completed' && (
              <View style={styles.lockedContainer}>
                <MaterialIcons name="lock" size={20} color={colors.gray[400]} />
                <Text style={styles.lockedText}>Complete previous milestone to unlock</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: fonts.sizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 24,
  },
  milestoneCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completedMilestone: {
    backgroundColor: colors.gray[100],
    borderColor: colors.primary,
  },
  activeMilestone: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  milestoneDescription: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: colors.primary,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
  },
  timeline: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[500],
  },
  progressSection: {
    marginVertical: 16,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    marginLeft: 8,
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
  },
  progressInfo: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[200],
    marginBottom: 8,
  },
  progressText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  startButtonText: {
    color: colors.background,
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    marginLeft: 8,
  },
  continueButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  continueButtonText: {
    color: colors.background,
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    marginLeft: 8,
  },
  lockedText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginTop: 8,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
}); 