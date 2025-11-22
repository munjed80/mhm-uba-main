/**
 * MHM UBA - Supabase Configuration
 * 
 * INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Project Settings > API
 * 3. Copy this file to supabase-config.js (gitignored)
 * 4. Replace the placeholder values below with your actual credentials
 * 5. Include this file in your HTML before supabase-api-service.js
 */

// ⚠️ DO NOT COMMIT THIS FILE WITH REAL CREDENTIALS
// Add supabase-config.js to .gitignore

// Replace these with your Supabase project credentials
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key-here';

/**
 * To get your credentials:
 * 1. Go to https://app.supabase.com/project/YOUR-PROJECT/settings/api
 * 2. Copy the "Project URL" 
 * 3. Copy the "anon" / "public" key (NOT the service_role key)
 * 
 * Example:
 * window.SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
 * window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 */
