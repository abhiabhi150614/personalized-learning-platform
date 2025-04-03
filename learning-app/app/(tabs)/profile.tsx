import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/auth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { supabase } from '../../services/supabase';
import { Stack } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
interface Profile {
  username: string;
  full_name: string;
  class: string;
  learning_goal: string;
}

export default function Profile() {
  const { session, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadProfile();
    }
  }, [session]);

  async function loadProfile() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    if (!session?.user || !profile) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', session.user.id);

      if (error) throw error;
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Profile',
          headerShown: true,
        }} 
      />
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
      {editing ? (
        <>
          <Input
            label="Username"
            value={profile?.username || ''}
            onChangeText={(text) => setProfile(p => p ? {...p, username: text} : null)}
          />
          <Input
            label="Full Name"
            value={profile?.full_name || ''}
            onChangeText={(text) => setProfile(p => p ? {...p, full_name: text} : null)}
          />
          <Input
            label="Class/Grade"
            value={profile?.class || ''}
            onChangeText={(text) => setProfile(p => p ? {...p, class: text} : null)}
          />
          <Input
            label="Learning Goal"
            value={profile?.learning_goal || ''}
            onChangeText={(text) => setProfile(p => p ? {...p, learning_goal: text} : null)}
          />
          <Button title="Save Changes" onPress={handleUpdateProfile} />
          <Button title="Cancel" onPress={() => setEditing(false)} variant="outline" />
        </>
      ) : (
        <>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{profile?.username}</Text>
          
          <Text style={styles.label}>Full Name</Text>
          <Text style={styles.value}>{profile?.full_name}</Text>
          
          
          
          <Text style={styles.label}>Learning Goal</Text>
          <Text style={styles.value}>{profile?.learning_goal}</Text>

          <Button title="Edit Profile" onPress={() => setEditing(true)} />
        </>
      )}

      <Button title="Sign Out" onPress={signOut} variant="outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  label: {
    fontSize: fonts.sizes.sm,
    fontFamily: fonts.medium,
    color: colors.gray[600],
    marginTop: 16,
  },
  value: {
    fontSize: fonts.sizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: 4,
  },
  title: {
    fontSize: fonts.sizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
  },
}); 