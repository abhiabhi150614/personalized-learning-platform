
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import moment from 'moment';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { extractPlaylistId, getPlaylistDetails, formatDuration } from '../../services/youtube';

interface Video {
  id: string;
  title: string;
  duration: string; // ISO8601 string, e.g. "PT2M30S"
}

interface PlaylistDetails {
  title: string;
  totalVideos: number;
  totalDuration: number;
  videos: Video[];
}

// ------------------------------------------------------------------
// Helper: Convert ISO8601 duration (e.g. "PT2M30S") to seconds
// ------------------------------------------------------------------
function convertDurationToSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

// ------------------------------------------------------------------
// Simple ProgressBar Component (declared once)
// ------------------------------------------------------------------
const ProgressBar = ({ progress }: { progress: number }) => {
  return (
    <View style={progressBarStyles.container}>
      <View style={[progressBarStyles.bar, { width: `${Math.min(progress, 1) * 100}%` }]} />
    </View>
  );
};

const progressBarStyles = StyleSheet.create({
  container: {
    height: 10,
    backgroundColor: colors.gray[300],
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 8,
  },
  bar: {
    height: 10,
    backgroundColor: colors.primary,
  },
});

// ------------------------------------------------------------------
// Main Component: YouTubeTracking
// ------------------------------------------------------------------
export default function YouTubeTracking() {
  // Playlist analysis and progress states
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlistDetails, setPlaylistDetails] = useState<PlaylistDetails | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  // Scheduling states
  const [dailyWatchTime, setDailyWatchTime] = useState(''); // in minutes (as string)
  // schedule: key = date (YYYY-MM-DD), value = array of videos scheduled for that day
  const [schedule, setSchedule] = useState<{ [date: string]: Video[] }>({});
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string>('');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  // Your API key – secure this in production
  const API_KEY = 'AIzaSyCkIZHhc47Rb1ZiAfWv1BRxAJG2Ly7PVjc';

  async function handleAnalyzePlaylist() {
    if (!playlistUrl.trim()) return;
    try {
      setLoading(true);
      const playlistId = extractPlaylistId(playlistUrl);
      if (!playlistId) {
        Alert.alert('Error', 'Invalid YouTube playlist URL');
        return;
      }
      // Pass the API key so that getPlaylistDetails fetches video durations
      const details = await getPlaylistDetails(playlistId, API_KEY);
      setPlaylistDetails(details);
    } catch (error) {
      console.error('Error analyzing playlist:', error);
      Alert.alert('Error', 'Failed to analyze playlist');
    } finally {
      setLoading(false);
    }
  }

  function handleCompletedCountChange(text: string) {
    const count = parseInt(text) || 0;
    if (count >= 0 && (!playlistDetails || count <= playlistDetails.totalVideos)) {
      setCompletedCount(count);
    }
  }

  const remainingVideos = playlistDetails ? playlistDetails.totalVideos - completedCount : 0;
  const remainingDuration = playlistDetails
    ? Math.round((remainingVideos / playlistDetails.totalVideos) * playlistDetails.totalDuration)
    : 0;

  // ------------------------------------------------------------------
  // computeSchedule: Distribute videos across days based on dailyMinutes.
  // If adding a video exceeds the daily limit, move to the next day.
  // If a video itself exceeds the limit on an empty day, schedule it alone.
  // ------------------------------------------------------------------
  function computeSchedule(videos: Video[], dailyMinutes: number) {
    const sched: { [date: string]: Video[] } = {};
    let currentDate = moment(); // start from today
    let dailyAccumulated = 0; // in minutes

    let key = currentDate.format('YYYY-MM-DD');
    sched[key] = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const duration = convertDurationToSeconds(video.duration) / 60; // duration in minutes

      if (dailyAccumulated + duration > dailyMinutes) {
        if (dailyAccumulated === 0) {
          // video itself exceeds limit, schedule alone on this day
          sched[key].push(video);
          // Force next video to next day
          currentDate = currentDate.add(1, 'days');
          dailyAccumulated = 0;
          key = currentDate.format('YYYY-MM-DD');
          sched[key] = [];
        } else {
          // Move to next day and schedule video
          currentDate = currentDate.add(1, 'days');
          dailyAccumulated = 0;
          key = currentDate.format('YYYY-MM-DD');
          sched[key] = [];
          sched[key].push(video);
          dailyAccumulated += duration;
        }
      } else {
        sched[key].push(video);
        dailyAccumulated += duration;
      }
    }
    return sched;
  }

  function handleGenerateSchedule() {
    if (playlistDetails && dailyWatchTime) {
      const minutes = parseFloat(dailyWatchTime);
      if (isNaN(minutes) || minutes <= 0) {
        Alert.alert('Error', 'Please enter a valid daily watch time in minutes.');
        return;
      }
      const sched = computeSchedule(playlistDetails.videos, minutes);
      setSchedule(sched);
      const firstDate = Object.keys(sched)[0];
      setSelectedScheduleDate(firstDate);
      setCurrentCalendarMonth(new Date(firstDate));
    } else {
      Alert.alert('Error', 'Please analyze a playlist and enter daily watch time.');
    }
  }

  // ------------------------------------------------------------------
  // Render Header for FlatList
  // ------------------------------------------------------------------
  const renderHeader = () => (
    <>
      <View style={styles.playlistCard}>
        <Text style={styles.playlistTitle}>{playlistDetails?.title}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Videos</Text>
            <Text style={styles.statValue}>{playlistDetails?.totalVideos}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Duration</Text>
            <Text style={styles.statValue}>
              {playlistDetails && formatDuration(playlistDetails.totalDuration)}
            </Text>
          </View>
        </View>
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Track Your Progress</Text>
          <TextInput
            style={styles.progressInput}
            value={completedCount.toString()}
            onChangeText={handleCompletedCountChange}
            keyboardType="number-pad"
            placeholder="Enter completed videos"
          />
          <Text style={styles.progressText}>
            Progress: {playlistDetails ? Math.round((completedCount / playlistDetails.totalVideos) * 100) : 0}%
          </Text>
          <ProgressBar
            progress={playlistDetails ? completedCount / playlistDetails.totalVideos : 0}
          />
        </View>
        <View style={styles.remainingSection}>
          <Text style={styles.sectionTitle}>Remaining</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Videos Left</Text>
              <Text style={styles.statValue}>{remainingVideos}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Time Left</Text>
              <Text style={styles.statValue}>
                {playlistDetails && formatDuration(remainingDuration)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>Enter Daily Watch Time (minutes)</Text>
        <TextInput
          style={styles.scheduleInput}
          value={dailyWatchTime}
          onChangeText={setDailyWatchTime}
          placeholder="e.g., 20"
          keyboardType="numeric"
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType="done"
          onSubmitEditing={() => {}}
          placeholderTextColor={colors.gray[400]}
        />
        <TouchableOpacity style={styles.scheduleButton} onPress={handleGenerateSchedule}>
          <Text style={styles.scheduleButtonText}>Generate Schedule</Text>
        </TouchableOpacity>
        {Object.keys(schedule).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Estimated Days Required: {Object.keys(schedule).length}
            </Text>
            <Text style={styles.sectionTitle}>Watch Schedule Calendar</Text>
            <LearningCalendar 
              month={currentCalendarMonth}
              dayStatuses={Object.keys(schedule).map(date => ({
                date,
                completed: false,
                minutesLearned: Math.round(
                  schedule[date].reduce((sum, video) => sum + convertDurationToSeconds(video.duration) / 60, 0)
                ),
                topicTitle: `${schedule[date].length} videos`
              }))}
              onMonthChange={(newMonth) => setCurrentCalendarMonth(newMonth)}
              onDayPress={(date) => setSelectedScheduleDate(date)}
            />
            <Text style={styles.sectionTitle}>
              Videos for {selectedScheduleDate}
            </Text>
          </>
        )}
      </View>
    </>
  );

  const scheduledVideos = schedule[selectedScheduleDate] || [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={playlistUrl}
          onChangeText={setPlaylistUrl}
          placeholder="Paste YouTube playlist URL"
          placeholderTextColor={colors.gray[400]}
        />
        <TouchableOpacity 
          style={[styles.analyzeButton, !playlistUrl && styles.disabledButton]}
          onPress={handleAnalyzePlaylist}
          disabled={!playlistUrl || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <MaterialIcons name="analytics" size={24} color={colors.background} />
          )}
        </TouchableOpacity>
      </View>

      {playlistDetails && (
        <FlatList
          data={scheduledVideos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.videoItem}>
              <Text style={styles.videoTitle}>{item.title}</Text>
              <Text style={styles.videoDuration}>
                Duration: {formatDuration(convertDurationToSeconds(item.duration))}
              </Text>
            </View>
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

// ------------------------------------------------------------------
// Custom Calendar Component (LearningCalendar)
// ------------------------------------------------------------------
interface LearningCalendarProps {
  month: Date;
  dayStatuses: {
    date: string;
    completed: boolean;
    minutesLearned: number;
    topicTitle?: string;
  }[];
  onMonthChange: (newMonth: Date) => void;
  onDayPress: (date: string) => void;
}

export function LearningCalendar({ month, dayStatuses, onMonthChange, onDayPress }: LearningCalendarProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(month.getMonth() - 1);
    onMonthChange(newMonth);
  };

  const nextMonth = () => {
    const newMonth = new Date(month);
    newMonth.setMonth(month.getMonth() + 1);
    onMonthChange(newMonth);
  };

  const renderDays = () => {
    const days = [];
    const daysInMonth = getDaysInMonth(month);
    const firstDay = getFirstDayOfMonth(month);
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={calendarStyles.dayCell} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day)
        .toISOString().split('T')[0];
      const dayStatus = dayStatuses.find(s => s.date === date);
      const isToday = date === today;
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            calendarStyles.dayCell,
            isToday && calendarStyles.todayCell,
            dayStatus?.completed && calendarStyles.completedCell
          ]}
          onPress={() => onDayPress(date)}
        >
          <Text style={[
            calendarStyles.dayText,
            isToday && calendarStyles.todayText,
            dayStatus?.completed && calendarStyles.completedText
          ]}>
            {day}
          </Text>
          {dayStatus?.completed && (
            <View style={calendarStyles.completionIndicator}>
              <MaterialIcons 
                name="check-circle" 
                size={16} 
                color={colors.background} 
              />
              <Text style={calendarStyles.minutesText}>
                {dayStatus.minutesLearned}m
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    return days;
  };

  return (
    <View style={calendarStyles.container}>
      <View style={calendarStyles.header}>
        <TouchableOpacity onPress={previousMonth}>
          <MaterialIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={calendarStyles.monthText}>
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </Text>
        <TouchableOpacity onPress={nextMonth}>
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={calendarStyles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={calendarStyles.weekDayText}>{day}</Text>
        ))}
      </View>
      <View style={calendarStyles.daysGrid}>
        {renderDays()}
      </View>
      <View style={calendarStyles.legend}>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={calendarStyles.legendText}>Completed</Text>
        </View>
        <View style={calendarStyles.legendItem}>
          <View style={[calendarStyles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={calendarStyles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayText: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  todayCell: {
    backgroundColor: colors.success + '20',
    borderRadius: 8,
  },
  todayText: {
    color: colors.success,
    fontFamily: fonts.bold,
  },
  completedCell: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  completedText: {
    color: colors.background,
    fontFamily: fonts.bold,
  },
  completionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  minutesText: {
    fontSize: fonts.sizes.xs,
    color: colors.background,
    marginLeft: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: fonts.sizes.sm,
    color: colors.gray[600],
  },
});

// ------------------------------------------------------------------
// Styles for main component
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: fonts.sizes.base,
    color: colors.text,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.gray[400],
  },
  detailsContainer: {
    flex: 1,
  },
  playlistCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  playlistTitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
    marginBottom: 4,
  },
  statValue: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  progressInput: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: 12,
    fontSize: fonts.sizes.base,
    color: colors.text,
  },
  progressText: {
    marginTop: 4,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  remainingSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  scheduleSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
  },
  scheduleInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: fonts.sizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  scheduleButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleButtonText: {
    color: colors.background,
    fontFamily: fonts.bold,
    fontSize: fonts.sizes.base,
  },
  videoItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  videoTitle: {
    fontFamily: fonts.medium,
    color: colors.text,
    fontSize: fonts.sizes.base,
  },
  videoDuration: {
    fontFamily: fonts.regular,
    color: colors.gray[600],
    fontSize: fonts.sizes.sm,
  },
});
