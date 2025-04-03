import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/auth';
import { Alert } from 'react-native';
import { Button } from '../../components/Button';
import { generateCareerPathWithGemini } from '../../services/gemini';
import { updateLearningStats, getNextTopic } from '../../services/topics';
import { MaterialIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native';
import { LearningCalendar } from '../../components/LearningCalendar';
import { InfoTooltip } from '../../components/InfoTooltip';
import { FeatureBox } from '../../components/FeatureBox';
import { FontAwesome5 } from '@expo/vector-icons';

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  progress: number;
}

interface UserCourse {
  course_id: string;
  progress: number;
  courses: {
    id: string;
    title: string;
    description: string;
    level: string;
  }[];
}

interface LearningStats {
  coursesCompleted: number;
  totalMinutesLearned: number;
  currentStreak: number;
}

interface CareerPath {
  id: string;
  created_at: string;
}

interface DailyTopic {
  id: string;
  title: string;
  description: string;
  estimated_minutes: number;
  completed: boolean;
  scheduled_for: string;
  user_id: string;
  milestone_id: string;
  skills_covered: string[];
  prerequisites: string[];
  resources: string[];
  practice_tasks: string[];
  completion_time?: string;
  feedback?: string;
  difficulty_rating?: number;
}

interface DayStatus {
  date: string;
  completed: boolean;
  minutesLearned: number;
  topicTitle?: string;
}

async function generateMilestonesWithGemini(profile: any) {
  // Let's make sure we're getting good test data
  return [
    {
      title: "Learn JavaScript Fundamentals",
      description: "Master core JavaScript concepts and syntax",
      timeline: "4 weeks",
      skills_required: ["Variables", "Functions", "Objects", "Arrays"],
      resources: ["MDN Web Docs", "JavaScript.info", "Codecademy"],
      status: "not_started",  // Add this
      order_index: 0         // Add this
    },
    {
      title: "Build Frontend Applications",
      description: "Create interactive web applications using React",
      timeline: "8 weeks",
      skills_required: ["React", "State Management", "Components", "Hooks"],
      resources: ["React Docs", "Frontend Masters", "GitHub Projects"],
      status: "not_started",  // Add this
      order_index: 1         // Add this
    }
  ];
}

export default function Home() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    coursesCompleted: 0,
    totalMinutesLearned: 0,
    currentStreak: 0,
  });
  const [careerPath, setCareerPath] = useState<CareerPath | null>(null);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [dailyTopic, setDailyTopic] = useState<DailyTopic | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<DayStatus[]>([]);

  useEffect(() => {
    if (session?.user) {
      loadUserProfile();
      loadUserCourses();
      loadLearningStats();
      loadCareerPath();
      loadDailyTopic();
      loadCalendarData(selectedMonth);
    }
  }, [session]);

  async function loadUserProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function loadUserCourses() {
    try {
      const { data, error } = await supabase
        .from('user_courses')
        .select(`
          course_id,
          progress,
          courses!inner (
            id,
            title,
            description,
            level
          )
        `)
        .eq('user_id', session?.user.id);

      if (error) throw error;
      
      setCourses(data?.map(item => ({
        id: item.course_id,
        title: item.courses[0]?.title || '',
        description: item.courses[0]?.description || '',
        level: item.courses[0]?.level || '',
        progress: item.progress || 0,
      })) || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  }

  async function loadLearningStats() {
    try {
      const { data, error } = await supabase
        .from('learning_stats')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (error) throw error;
      
      setStats({
        coursesCompleted: data.courses_completed || 0,
        totalMinutesLearned: data.total_minutes_learned || 0,
        currentStreak: data.current_streak || 0,
      });
    } catch (error) {
      console.error('Error loading learning stats:', error);
    }
  }

  async function loadCareerPath() {
    try {
      const { data, error } = await supabase
        .from('career_paths')
        .select(`
          *,
          career_milestones (
            id,
            title,
            description,
            skills_required,
            resources,
            status,
            timeline,
            current_topic_id,
            completed_topics,
            order_index
          )
        `)
        .eq('user_id', session?.user.id)
        .order('created_at', { foreignTable: 'career_milestones', ascending: true })
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Sort milestones by order_index if they exist
        data.career_milestones = data.career_milestones?.sort(
          (a, b) => a.order_index - b.order_index
        );
      }
      
      setCareerPath(data);
    } catch (error) {
      console.error('Error loading career path:', error);
    }
  }

  async function loadDailyTopic() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First check for today's incomplete topic
      const { data: todayTopic, error: todayError } = await supabase
        .from('daily_topics')
        .select(`
          *,
          milestone:career_milestones!daily_topics_milestone_id_fkey (
            id,
            title,
            description,
            skills_required
          )
        `)
        .eq('user_id', session?.user.id)
        .eq('scheduled_for', today)
        .eq('completed', false)
        .order('created_at')
        .limit(1)
        .single();

      if (!todayError && todayTopic) {
        setDailyTopic({
          ...todayTopic,
          skills_covered: todayTopic.milestone?.skills_required || [],
          practice_tasks: todayTopic.practice_tasks || [],
          prerequisites: todayTopic.prerequisites || [],
          resources: todayTopic.resources || []
        });
        return;
      }

      // If no incomplete topic, get tomorrow's topic
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data: nextTopic, error: nextError } = await supabase
        .from('daily_topics')
        .select(`
          *,
          milestone:career_milestones!daily_topics_milestone_id_fkey (
            id,
            title,
            description,
            skills_required
          )
        `)
        .eq('user_id', session?.user.id)
        .eq('scheduled_for', tomorrowDate)
        .order('created_at')
        .limit(1)
        .single();

      if (!nextError && nextTopic) {
        setDailyTopic({
          ...nextTopic,
          title: `Coming Tomorrow: ${nextTopic.title}`,
          skills_covered: nextTopic.milestone?.skills_required || [],
          practice_tasks: nextTopic.practice_tasks || [],
          prerequisites: nextTopic.prerequisites || [],
          resources: nextTopic.resources || []
        });
      } else {
        setDailyTopic(null);
      }

    } catch (error) {
      console.error('Error loading daily topic:', error);
      setDailyTopic(null);
    }
  }

  async function completeDailyTopic() {
    if (!dailyTopic || !session?.user) return;

    try {
      // Mark current topic as complete
      const { error: topicError } = await supabase
        .from('daily_topics')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString(),
          feedback: feedback,
          difficulty_rating: difficultyRating
        })
        .eq('id', dailyTopic.id);

      if (topicError) throw topicError;

      // Update learning stats
      await updateLearningStats(session.user.id, dailyTopic.estimated_minutes);

      // Get next topic
      const nextTopic = await getNextTopic(dailyTopic.id);

      // Update milestone status
      await supabase
        .from('career_milestones')
        .update({ 
          current_topic_id: nextTopic?.id || null,
          status: nextTopic ? 'in_progress' : 'completed'
        })
        .eq('id', dailyTopic.milestone_id);

      // Reset modal state
      setShowCompletionModal(false);
      setDifficultyRating(null);
      setFeedback('');

      // Refresh all data
      await Promise.all([
        loadDailyTopic(),
        loadLearningStats(),
        loadCareerPath(),
        loadCalendarData(selectedMonth)
      ]);

      // Show success message
      Alert.alert(
        'Topic Completed!',
        'Great job! Check out your next topic.',
        [
          {
            text: 'OK',
            onPress: () => loadDailyTopic() // Reload to show tomorrow's topic
          }
        ]
      );

    } catch (error) {
      console.error('Error completing topic:', error);
      Alert.alert('Error', 'Failed to complete topic. Please try again.');
    }
  }

  async function generateCareerPath() {
    if (!profile || !session?.user) return;
    
    try {
      setGeneratingPath(true);
      console.log("Starting career path generation...");

      // Generate milestones using Gemini
      const milestones = await generateCareerPathWithGemini(profile);
      console.log("Generated milestones:", milestones);

      // Create career path
      const { data: pathData, error: pathError } = await supabase
        .from('career_paths')
        .insert({
          user_id: session.user.id
        })
        .select()
        .single();

      if (pathError) throw pathError;
      console.log("Created career path:", pathData);

      // Create milestones with proper validation
      for (const milestone of milestones) {
        const { error: milestoneError } = await supabase
          .from('career_milestones')
          .insert({
            career_path_id: pathData.id,
            title: milestone.title,
            description: milestone.description,
            timeline: milestone.timeline,
            skills_required: Array.isArray(milestone.skills_required) ? milestone.skills_required : [],
            resources: Array.isArray(milestone.resources) ? milestone.resources : [],
            status: 'not_started',
            order_index: milestone.order_index,
            completed_topics: []
          });

        if (milestoneError) {
          console.error("Milestone creation error:", milestoneError);
          throw milestoneError;
        }
      }

      // Reload the career path to get the complete data
      await loadCareerPath();
      setShowCareerModal(false);
      Alert.alert('Success!', 'Your personalized career path has been generated.');

    } catch (error) {
      console.error('Error generating career path:', error);
      Alert.alert('Error', 'Failed to generate career path. Please try again.');
    } finally {
      setGeneratingPath(false);
    }
  }

  async function loadCalendarData(month: Date) {
    try {
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1)
        .toISOString().split('T')[0];
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)
        .toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_topics')
        .select('*')
        .eq('user_id', session?.user.id)
        .gte('scheduled_for', startDate)
        .lte('scheduled_for', endDate);

      if (error) throw error;

      setCalendarData(data.map(topic => ({
        date: topic.scheduled_for,
        completed: topic.completed,
        minutesLearned: topic.estimated_minutes,
        topicTitle: topic.title
      })));
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }

  function handleDayPress(date: string) {
    const dayData = calendarData.find(d => d.date === date);
    if (dayData) {
      Alert.alert(
        dayData.topicTitle || 'Learning Session',
        dayData.completed 
          ? `Completed! (${dayData.minutesLearned} minutes)`
          : 'Not completed yet'
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      {/*
      <Stack.Screen 
        options={{ 
          title: 'Home',
          headerShown: true,
        }} 
      /> */ }
       <View style={{ flexDirection: 'row', alignItems: 'center' , margin : 10 }}>
      <View style={{ marginRight: 10 }}>
        <FontAwesome5 name="graduation-cap" size={32} color="#000" />
      </View>
      <View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
          WORK <Text style={{ color: '#007AFF' }}>FLUX</Text>
        </Text>
      </View>
    </View>
      

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Welcome back {profile?.full_name?.split(' ')[0] || 'Learner'}!
        </Text>
        <Text style={styles.subtitle}>
          Continue your journey
        </Text>
      </View>

      {/* Learning Features Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning Features</Text>
          <InfoTooltip 
            title="Learning Tools"
            description="Access your learning tools and track your progress"
          />
        </View>

        <FeatureBox
          title="Your Progress"
          description="Track your  journey and achievements"
          icon="trending-up"
          color="#8b5cf6"
          onPress={() => {
            router.push({
              pathname: "/features/progress",
              params: { from: 'home' }
            });
          }}
        />

        <FeatureBox
          title="AI Skill-Up Assistant"
          description="Get personalized help with your query"
          icon="psychology"
          color="#6366f1"
          onPress={() => {
            router.push({
              pathname: "/features/ai-assistant",
              params: { from: 'home' }
            });
          }}
        />

        <FeatureBox
          title="YouTube Progress"
          description="Track your learning from YouTube playlists"
          icon="play-circle-filled"
          color="#ff0000"
          onPress={() => {
            router.push({
              pathname: "/features/youtube-tracking",
              params: { from: 'home' }
            });
          }}
        />

        <FeatureBox
          title="Focused Mode"
          description="AI-powered focus monitoring while studying"
          icon="visibility"
          color="#0ea5e9"
          onPress={() => {
            router.push({
              pathname: "/features/focused-study",
              params: { from: 'home' }
            });
          }}
        />
      
      

        

        
      </View>

      {/* Today's Learning Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Learning</Text>
          <InfoTooltip 
            title="Daily Topic"
            description="Complete your daily learning topic to maintain your streak"
          />
        </View>

        {dailyTopic ? (
          <View style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicTitle}>{dailyTopic.title}</Text>
              <View style={styles.timeContainer}>
                <MaterialIcons name="access-time" size={20} color={colors.primary} />
                <Text style={styles.timeText}>{dailyTopic.estimated_minutes} min</Text>
              </View>
            </View>

            <Text style={styles.topicDescription}>{dailyTopic.description}</Text>

            {dailyTopic.skills_covered?.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={styles.subsectionTitle}>Skills You'll Learn:</Text>
                <View style={styles.skillsList}>
                  {dailyTopic.skills_covered.map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {dailyTopic.practice_tasks?.length > 0 && (
              <View style={styles.tasksSection}>
                <Text style={styles.subsectionTitle}>Practice Tasks:</Text>
                {dailyTopic.practice_tasks.map((task, index) => (
                  <View key={index} style={styles.taskItem}>
                    <MaterialIcons name="assignment" size={20} color={colors.primary} />
                    <Text style={styles.taskText}>{task}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => setShowCompletionModal(true)}
            >
              <Text style={styles.completeButtonText}>Complete Topic</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="check-circle" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>All Done!</Text>
            <Text style={styles.emptyText}>
              You've completed all your topics for today. Check back tomorrow!
            </Text>
          </View>
        )}
      </View>

      {/* Career Path Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Career Path</Text>
          <InfoTooltip 
            title="Learning Journey"
            description="Follow your personalized learning path to achieve your career goals"
          />
        </View>

        {careerPath ? (
          <TouchableOpacity 
            style={styles.careerPathCard}
            onPress={() => router.push('/career-path')}
          >
            <View style={styles.careerPathContent}>
              <View>
                <Text style={styles.careerPathTitle}>Your Learning Journey</Text>
                <Text style={styles.careerPathDescription}>
                  Continue on your personalized learning path
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
            </View>
            {dailyTopic && (
              <View style={styles.currentTopicContainer}>
                <Text style={styles.currentTopicLabel}>Current Topic:</Text>
                <Text style={styles.currentTopicTitle} numberOfLines={1}>
                  {dailyTopic.title}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.careerPathCard}>
            <Text style={styles.careerPathTitle}>Get Started</Text>
            <Text style={styles.careerPathDescription}>
              Generate your personalized learning path based on your goals and interests.
            </Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={() => setShowCareerModal(true)}
            >
              <Text style={styles.generateButtonText}>Generate Career Path</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Learning Calendar Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Learning Calendar</Text>
          <InfoTooltip 
            title="Progress Tracker"
            description="Track your daily learning progress and maintain your streak"
          />
        </View>

        <LearningCalendar
          month={selectedMonth}
          dayStatuses={calendarData}
          onMonthChange={setSelectedMonth}
          onDayPress={handleDayPress}
        />
      </View>

      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Topic</Text>
            <Text style={styles.modalText}>How difficult was this topic?</Text>

            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    difficultyRating === rating && styles.selectedRating
                  ]}
                  onPress={() => setDifficultyRating(rating)}
                >
                  <Text style={[
                    styles.ratingText,
                    difficultyRating === rating && { color: colors.background }
                  ]}>
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Any feedback or notes? (optional)"
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={completeDailyTopic}
              >
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  Complete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Career Path Modal */}
      <Modal
        visible={showCareerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCareerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Generate Career Path</Text>
            <Text style={styles.modalText}>
              We'll create a personalized learning path based on your profile and goals.
              This might take a moment.
            </Text>
            {generatingPath ? (
              <ActivityIndicator style={styles.loader} color={colors.primary} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowCareerModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={generateCareerPath}
                >
                  <Text style={[styles.buttonText, { color: colors.background }]}>
                    Generate
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoIcon: {
    marginRight: 8,
  },
  logoText: {},
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  span: {
    color: '#007AFF', // Customize the color as needed
  },
  welcomeSection: {
    borderRadius:20,
    margin:10,
    padding: 24,
    backgroundColor: colors.primary,
  },
  welcomeText: {
    fontSize: fonts.sizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.background,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    color: colors.background,
    opacity: 0.8,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
    backgroundColor: colors.background,
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: '30%',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: fonts.sizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.primary,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
    textAlign: 'center',
  },
  courseCard: {
    width: 280,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  courseLevel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.primary,
    marginBottom: 8,
  },
  courseProgress: {
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  challengeCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginBottom: 12,
  },
  challengeReward: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  careerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  careerButtonText: {
    color: colors.background,
    fontFamily: fonts.medium,
    fontSize: fonts.sizes.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  loader: {
    marginTop: 24,
  },
  topicCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginRight: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
  },
  topicDescription: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginBottom: 12,
  },
  skillsSection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  tasksSection: {
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginLeft: 8,
  },
  resourcesSection: {
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginLeft: 8,
  },
  completeButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: colors.background,
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingButton: {
    backgroundColor: colors.gray[200],
    padding: 12,
    borderRadius: 8,
  },
  selectedRating: {
    backgroundColor: colors.primary,
  },
  ratingText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  feedbackInput: {
    height: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  calendarButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarButtonText: {
    color: colors.background,
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
  },
  careerPathCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  careerPathContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  careerPathTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  careerPathDescription: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: colors.background,
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  currentTopicContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  currentTopicLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
    marginBottom: 4,
  },
  currentTopicTitle: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
}); 