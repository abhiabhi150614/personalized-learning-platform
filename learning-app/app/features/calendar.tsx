import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '../../constants/colors';
import { LearningCalendar } from '../../components/LearningCalendar';
import { useAuth } from '../../contexts/auth';
import { supabase } from '../../services/supabase';

export default function CalendarFeature() {
  const { session } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);

  useEffect(() => {
    if (session?.user) {
      loadCalendarData(selectedMonth);
    }
  }, [session, selectedMonth]);

  async function loadCalendarData(month: Date) {
    // Add your existing calendar data loading logic here
  }

  function handleDayPress(date: string) {
    // Add your day press handler logic here
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Learning Calendar',
          headerShown: true,
        }} 
      />

      <View style={styles.content}>
        <LearningCalendar
          month={selectedMonth}
          dayStatuses={calendarData}
          onMonthChange={setSelectedMonth}
          onDayPress={handleDayPress}
        />
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
}); 