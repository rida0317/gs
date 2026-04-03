// src/lib/supabaseClient.ts - Supabase Configuration

import { createClient } from '@supabase/supabase-js'

// Try to get values from environment, or use fallbacks if missing
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yekirbhezyoefnhyxslt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlla2lyYmhlenlvZWZuaHl4c2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzMxNjUsImV4cCI6MjA5MDQ0OTE2NX0.JlvoVn3zzPeN-e5_TW37k81ZZ65MYjiVl7fY5IEDz4A'

// Verification - check if we're using placeholders
const isConfigured = supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseAnonKey && supabaseAnonKey !== 'placeholder'

if (!isConfigured) {
  console.warn('⚠️ Supabase credentials are missing or using placeholders. App might not function correctly.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'school-mgmt-system'
    }
  }
})

export default supabase
