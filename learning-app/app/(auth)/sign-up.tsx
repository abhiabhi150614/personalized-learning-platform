import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { supabase } from '../../services/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    if (loading) return;

    try {
      setLoading(true);
      setError('');

      // Validation
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (!password.trim()) {
        throw new Error('Password is required');
      }
      if (!confirmPassword.trim()) {
        throw new Error('Please confirm your password');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Step 1: Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Step 2: Create initial profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email.trim(),
        });

      if (profileError) {
        // If profile creation fails, we should delete the auth user
        await supabase.auth.signOut();
        throw profileError;
      }

      // Success - show message and navigate
      Alert.alert(
        'Success',
        'Account created successfully! Please complete your profile.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/onboarding/profile-setup')
          }
        ]
      );
    } catch (e) {
      setError(e.message);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center' , margin : 10 , marginTop:10}}>
      <View style={{ marginRight: 10 }}>
        <FontAwesome5 name="graduation-cap" size={32} color="#000" />
      </View>
      <View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
          Work <Text style={{ color: '#007AFF' }}>FLUX</Text>
        </Text>
      </View>
    </View>
      <Stack.Screen options={{ 
        title: 'Create Account',
        headerShown: false,
      }} />

      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us and start learning</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Input
          label="Password"
          placeholder="Create a password (min. 6 characters)"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
          editable={!loading}
        />

        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError('');
          }}
          secureTextEntry
          editable={!loading}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.buttons}>
          <Button
            title={loading ? "Creating Account..." : "Create Account"}
            onPress={handleSignUp}
            disabled={loading}
          />

          <Button
            title="Already have an account? Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
            disabled={loading}
          />
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
  header: {
    padding: 24,
    paddingTop: 100,
  },
  title: {
    fontSize: fonts.sizes['3xl'],
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
  buttons: {
    gap: 12,
    marginTop: 24,
  },
}); 