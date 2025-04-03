import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/auth';
import { useLearningStats } from '../../hooks/useLearningStats';
import { ProgressBar } from '../../components/ProgressBar';

export default function Progress() {
  const { session } = useAuth();
  const { stats, loading } = useLearningStats();

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="trending-up" size={48} color={colors.primary} />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const calculateLevel = (coursesCompleted: number) => {
    const levelsMap = [
      { threshold: 0, name: "Beginner", color: "#4ade80" },
      { threshold: 5, name: "Intermediate", color: "#2563eb" },
      { threshold: 10, name: "Advanced", color: "#8b5cf6" },
      { threshold: 20, name: "Expert", color: "#f59e0b" },
      { threshold: 30, name: "Master", color: "#ef4444" }
    ];
    
    const level = levelsMap.reverse().find(l => coursesCompleted >= l.threshold);
    return level || levelsMap[0];
  };

  const currentLevel = calculateLevel(stats.coursesCompleted);
  const nextLevel = calculateLevel(stats.coursesCompleted + 1);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Level Banner */}
        <View style={[styles.levelBanner, { backgroundColor: currentLevel.color + '20' }]}>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelTitle, { color: currentLevel.color }]}>
              {currentLevel.name} Level
            </Text>
            <Text style={styles.levelProgress}>
              {stats.coursesCompleted} courses completed
            </Text>
          </View>
          <MaterialIcons 
            name="emoji-events" 
            size={48} 
            color={currentLevel.color} 
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="book" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{stats.coursesCompleted}</Text>
            <Text style={styles.statLabel}>Courses{'\n'}Completed</Text>
            <ProgressBar 
              progress={stats.coursesCompleted / (nextLevel.threshold)}
              color={currentLevel.color}
              style={styles.levelProgress}
              height={4}
            />
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="timer" size={32} color="#22c55e" />
            <Text style={styles.statValue}>{stats.totalMinutesLearned}</Text>
            <Text style={styles.statLabel}>Minutes{'\n'}Learned</Text>
            <ProgressBar 
              progress={Math.min(stats.totalMinutesLearned / 3600, 1)}
              color="#22c55e"
              style={styles.levelProgress}
              height={4}
            />
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
            <ProgressBar 
              progress={Math.min(stats.currentStreak / 30, 1)}
              color="#f59e0b"
              style={styles.levelProgress}
              height={4}
            />
          </View>
        </View>

        {/* Next Level Progress */}
        <View style={styles.nextLevelCard}>
          <View style={styles.nextLevelHeader}>
            <Text style={styles.nextLevelTitle}>Next Level: {nextLevel.name}</Text>
            <Text style={styles.nextLevelSubtitle}>
              {nextLevel.threshold - stats.coursesCompleted} courses to go
            </Text>
          </View>
          <ProgressBar 
            progress={stats.coursesCompleted / nextLevel.threshold}
            color={nextLevel.color}
            style={styles.nextLevelProgress}
            height={8}
          />
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          
          <View style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: "#f59e0b20" }]}>
              <MaterialIcons 
                name="emoji-events" 
                size={32} 
                color={stats.currentStreak >= 7 ? "#f59e0b" : colors.gray[400]} 
              />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Weekly Warrior</Text>
              <Text style={styles.achievementDesc}>
                Maintain a 7-day learning streak
              </Text>
              <ProgressBar 
                progress={Math.min(stats.currentStreak / 7, 1)}
                color="#f59e0b"
                style={styles.achievementProgress}
                height={4}
              />
            </View>
          </View>

          <View style={styles.achievementCard}>
            <View style={[styles.achievementIcon, { backgroundColor: "#8b5cf620" }]}>
              <MaterialIcons 
                name="psychology" 
                size={32} 
                color={stats.coursesCompleted >= 10 ? "#8b5cf6" : colors.gray[400]} 
              />
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementTitle}>Knowledge Seeker</Text>
              <Text style={styles.achievementDesc}>
                Complete 10 learning topics
              </Text>
              <ProgressBar 
                progress={Math.min(stats.coursesCompleted / 10, 1)}
                color="#8b5cf6"
                style={styles.achievementProgress}
                height={4}
              />
            </View>
          </View>
        </View>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.medium,
    color: colors.gray[600],
  },
  levelBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  levelProgress: {
    marginTop: 8,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  nextLevelCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextLevelHeader: {
    marginBottom: 16,
  },
  nextLevelTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  nextLevelSubtitle: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.medium,
    color: colors.gray[600],
  },
  nextLevelProgress: {
    height: 8,
    borderRadius: 4,
  },
  achievementsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    marginBottom: 8,
  },
  achievementProgress: {
    height: 4,
    borderRadius: 2,
  },
}); 