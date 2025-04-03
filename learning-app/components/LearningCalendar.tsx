import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { fonts } from '../constants/fonts';

interface DayStatus {
  date: string;
  completed: boolean;
  minutesLearned: number;
  topicTitle?: string;
}

interface LearningCalendarProps {
  month: Date;
  dayStatuses: DayStatus[];
  onMonthChange: (newMonth: Date) => void;
  onDayPress: (date: string) => void;
}

export function LearningCalendar({ 
  month, 
  dayStatuses, 
  onMonthChange,
  onDayPress 
}: LearningCalendarProps) {
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

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day)
        .toISOString().split('T')[0];
      const dayStatus = dayStatuses.find(s => s.date === date);
      const isToday = date === today;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            dayStatus?.completed && styles.completedCell
          ]}
          onPress={() => onDayPress(date)}
        >
          <Text style={[
            styles.dayText,
            isToday && styles.todayText,
            dayStatus?.completed && styles.completedText
          ]}>
            {day}
          </Text>
          {dayStatus?.completed && (
            <View style={styles.completionIndicator}>
              <MaterialIcons 
                name="check-circle" 
                size={16} 
                color={colors.background} 
              />
              <Text style={styles.minutesText}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={previousMonth}>
          <MaterialIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[month.getMonth()]} {month.getFullYear()}
        </Text>
        <TouchableOpacity onPress={nextMonth}>
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {renderDays()}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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