import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { MaterialIcons } from '@expo/vector-icons';
import { useDailyTopics } from '../../hooks/useDailyTopics';

export default function DailyTopics() {
  const { dailyTopic, completeTopic, loading } = useDailyTopics();
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

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
                onPress={() => {
                  completeTopic(feedback, difficultyRating);
                  setShowCompletionModal(false);
                }}
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
  topicCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  topicDescription: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  skillsSection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
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
    fontSize: 16,
    color: colors.textPrimary,
  },
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingButton: {
    backgroundColor: colors.textSecondary,
    borderRadius: 8,
    padding: 12,
    width: '20%',
  },
  selectedRating: {
    backgroundColor: colors.primary,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background,
    textAlign: 'center',
  },
  feedbackInput: {
    backgroundColor: colors.textSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    width: '48%',
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background,
    textAlign: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 