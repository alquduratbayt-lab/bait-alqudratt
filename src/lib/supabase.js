import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyrdpmhzwjejkstwovyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cmRwbWh6d2plamtzdHdvdnl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDA2NjgsImV4cCI6MjA4MTAxNjY2OH0.h3uh9XojuEULP_lEtSeroYrKaWSjDnaS36yz1ZKwqvY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
