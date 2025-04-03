import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { useDailyTopics } from '../../hooks/useDailyTopics';
import { DailyTopic } from '../../types';
import { TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function DailyTopics() {
  const { dailyTopic, completeTopic, loading } = useDailyTopics();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const { from } = useLocalSearchParams();

  async function handleCompleteTopic() {
    try {
      await completeTopic(feedback, difficultyRating);
      setShowCompletionModal(false);
      setDifficultyRating(null);
      setFeedback('');
    } catch (error) {
      console.error('Error completing topic:', error);
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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
                  <Text style={styles.ratingText}>{rating}</Text>
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
                onPress={handleCompleteTopic}
              >
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  Complete
                </Text>
              </TouchableOpacity>
            </View>
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
  content: {
    padding: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
    textAlign: 'center',
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
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  timeText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.gray[600],
  },
  topicDescription: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 16,
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
  },
  skillBadge: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
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
    color: colors.text,
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: fonts.sizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },
  modalText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
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
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  cancelButton: {
    backgroundColor: colors.gray[600],
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.background,
  },
}); 