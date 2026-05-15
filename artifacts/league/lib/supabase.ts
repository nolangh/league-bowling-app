import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://wtgphatzheodjsqznedg.supabase.co";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0Z3BoYXR6aGVvZGpzcXpuZWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3ODMzODgsImV4cCI6MjA5MzM1OTM4OH0.2AO0Vu6pFYWJgE39lNuC6xUB8Tcjk4ay1vYdW-w6lj4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
