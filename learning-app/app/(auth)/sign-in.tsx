import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { supabase } from '../../services/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    try {
      setLoading(true);
      setError('');

      // Validate inputs
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check if error is due to user not found
        if (signInError.message.includes('Invalid login credentials')) {
          Alert.alert(
            'Account Not Found',
            'Would you like to create a new account?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Create Account',
                onPress: () => router.push('/(auth)/sign-up'),
              },
            ]
          );
          return;
        }
        throw signInError;
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateAccount = () => {
    router.push('/(auth)/sign-up');
  };

  return (
    
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center' , margin : 10 }}>
      <View style={{ marginRight: 10 }}>
        <FontAwesome5 name="graduation-cap" size={32} color="#000" />
      </View>
      <View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#000' }}>
          WORK <Text style={{ color: '#007AFF' }}>FLUX</Text>
        </Text>
      </View>
    </View>
      <Stack.Screen options={{ 
        title: 'Sign In',
        headerShown: false,
      }} />

      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Sign in to continue learning</Text>
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
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <View style={styles.buttons}>
          <Button
            title="Sign In"
            onPress={handleSignIn}
            disabled={loading}
          />

          <Button
            title="Create New Account"
            onPress={handleCreateAccount}
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