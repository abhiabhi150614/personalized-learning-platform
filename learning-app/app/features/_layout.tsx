import { Stack } from 'expo-router';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

export default function FeaturesLayout() {
  return (
    <Stack 
      screenOptions={{
        headerShown: true,
        presentation: 'card',
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          fontFamily: fonts.bold,
          color: colors.text,
        },
        headerTintColor: colors.primary,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="daily-topics"
        options={{ 
          title: "Today's Learning",
        }} 
      />
      <Stack.Screen 
        name="career-path"
        options={{ 
          title: "Career Path",
        }} 
      />
      <Stack.Screen 
        name="calendar"
        options={{ 
          title: "Learning Calendar",
        }} 
      />
      <Stack.Screen 
        name="ai-assistant"
        options={{ 
          title: "AI Study Assistant",
        }} 
      />
      <Stack.Screen 
        name="progress"
        options={{ 
          title: "Your Progress",
        }} 
      />
    </Stack>
  );
} 