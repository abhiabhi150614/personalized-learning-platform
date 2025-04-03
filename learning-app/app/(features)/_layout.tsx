import { Stack } from 'expo-router/stack';

export default function FeaturesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="daily-topics" 
        options={{ title: "Today's Learning" }} 
      />
      <Stack.Screen 
        name="career-path" 
        options={{ title: "Career Path" }} 
      />
      <Stack.Screen 
        name="calendar" 
        options={{ title: "Learning Calendar" }} 
      />
      <Stack.Screen 
        name="ai-assistant" 
        options={{ title: "AI Study Assistant" }} 
      />
    </Stack>
  );
} 