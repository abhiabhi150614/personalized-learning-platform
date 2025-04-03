import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/auth';
import type { Profile } from '../../types/profile';

export default function ProfileSetup() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    className: '',
    learningGoal: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  async function handleProfileSetup() {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError('');

      // Validate inputs
      if (!formData.username || !formData.fullName || !formData.className || !formData.learningGoal) {
        throw new Error('Please fill in all fields');
      }

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username)
        .not('id', 'eq', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.fullName,
          class: formData.className,
          learning_goal: formData.learningGoal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Show success message
      Alert.alert(
        'Profile Updated',
        'Your profile has been set up successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/home')
          }
        ]
      );
    } catch (e) {
      console.error('Profile setup error:', e);
      setError(e.message);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Complete Your Profile',
          headerBackVisible: false,
          headerShown: true
        }} 
      />

      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us more about yourself</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Username"
          placeholder="Choose a unique username"
          value={formData.username}
          onChangeText={(text) => updateFormData('username', text)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChangeText={(text) => updateFormData('fullName', text)}
          autoComplete="name"
        />

        <Input
          label="Class/Grade"
          placeholder="Enter your class or grade"
          value={formData.className}
          onChangeText={(text) => updateFormData('className', text)}
        />

        <Input
          label="Learning Goal"
          placeholder="What do you want to achieve?"
          value={formData.learningGoal}
          onChangeText={(text) => updateFormData('learningGoal', text)}
          multiline
          numberOfLines={3}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Button
          title="Complete Setup"
          onPress={handleProfileSetup}
          disabled={loading}
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
  header: {
    padding: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: fonts.sizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fonts.sizes.lg,
    fontFamily: fonts.regular,
    color: colors.gray[600],
  },
  form: {
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: fonts.sizes.sm,
    marginBottom: 16,
  },
}); 