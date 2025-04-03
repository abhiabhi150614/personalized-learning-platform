import React from 'react';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/auth';
import { supabase } from '../services/supabase';
import { Stack } from 'expo-router/stack';

// Wrap the app with auth provider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    async function checkNavigation() {
      try {
        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';
        const inFeaturesGroup = segments[0] === 'features';
        
        // Don't redirect if we're in features or career path
        if (inFeaturesGroup || segments[0] === 'career-path') return;

        // If no session and not in auth group, redirect to sign in
        if (!session && !inAuthGroup) {
          router.replace('/(auth)/sign-in');
          return;
        }

        // If has session, check profile completion
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name, class, learning_goal')
            .eq('id', session.user.id)
            .single();

          const isProfileComplete = profile?.username && profile?.full_name && profile?.class && profile?.learning_goal;

          if (!isProfileComplete && segments[0] !== 'onboarding') {
            router.replace('/onboarding/profile-setup');
            return;
          }

          // Only redirect to home if not in any special group
          if (isProfileComplete && !inTabsGroup && !inFeaturesGroup && segments[0] !== 'career-path') {
            router.replace('/(tabs)/home');
            return;
          }
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }

    checkNavigation();
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="career-path" options={{ headerShown: true }} />
      <Stack.Screen 
        name="features" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
    </Stack>
  );
} 