import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project credentials
const supabaseUrl = 'https://rpekgkkbbyrxivyqzsjh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwZWtna2tiYnlyeGl2eXF6c2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxMzE3ODYsImV4cCI6MjA1NTcwNzc4Nn0.WYjeZP-CBjrXJN_neXNBailUiNkZHZunNJDFbabe2z4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 
