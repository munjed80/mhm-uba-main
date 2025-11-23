/**
 * MHM UBA - Supabase Configuration
 * 
 * ⚠️ IMPORTANT: Replace the placeholder values below with your actual Supabase credentials
 * 
 * To get your credentials:
 * 1. Go to https://app.supabase.com
 * 2. Select your project (or create one: "uba-production")
 * 3. Go to Settings → API
 * 4. Copy the "Project URL" and "anon public" key
 * 5. Replace the values below
 */

// Replace with your Supabase project URL
// Format: https://[project-id].supabase.co
window.SUPABASE_URL = 'https://your-project-id.supabase.co';

// Replace with your Supabase anon/public key  
// This key is safe to use in the browser
window.SUPABASE_ANON_KEY = 'your-anon-key-here';

// Configuration options
window.SUPABASE_OPTIONS = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'mhm-uba'
    }
  }
};

// Helper function to check if Supabase is configured
window.isSupabaseConfigured = function() {
  return window.SUPABASE_URL && 
         window.SUPABASE_URL !== 'https://your-project-id.supabase.co' &&
         window.SUPABASE_ANON_KEY && 
         window.SUPABASE_ANON_KEY !== 'your-anon-key-here';
};

// Helper function to get configuration status
window.getSupabaseConfigStatus = function() {
  const isConfigured = window.isSupabaseConfigured();
  
  return {
    configured: isConfigured,
    url: window.SUPABASE_URL,
    hasAnonKey: !!window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY.startsWith('eyJ'),
    message: isConfigured 
      ? 'Supabase is configured and ready to use'
      : 'Supabase is not configured. Please update supabase-config.js with your credentials'
  };
};

// Log configuration status on load
document.addEventListener('DOMContentLoaded', function() {
  const status = window.getSupabaseConfigStatus();
  
  if (status.configured) {
    console.log('✅ Supabase configuration loaded successfully');
    console.log('📡 Project URL:', window.SUPABASE_URL);
  } else {
    console.warn('⚠️ Supabase not configured');
    console.warn('Please update supabase-config.js with your project credentials');
    console.warn('Get credentials from: https://app.supabase.com/project/_/settings/api');
  }
});
