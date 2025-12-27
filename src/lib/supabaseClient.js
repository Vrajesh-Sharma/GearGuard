import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase credentials. Check .env.local:\n" +
    "VITE_SUPABASE_URL=your-url\n" +
    "VITE_SUPABASE_ANON_KEY=your-key"
  );
}

// Create single instance (singleton pattern)
let supabaseInstance = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseInstance;
})();

// Helper: Get current user (mock for demo)
export const getCurrentUser = () => ({
  id: "user-demo-123",
  email: "demo@gearguard.com",
  full_name: "Demo User",
});
