// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Replace these with your Supabase project URL and anon key
// Get them free at https://supabase.com → New Project → Settings → API
const SUPABASE_URL = 'https://jxglitqiqwmzygrcmros.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_FiFAJy7SjtQ19yLNq9lJkg_lVWsuAST';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS === 'web' ? {} : { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  emailVerified: boolean;
};
