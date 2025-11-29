import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the backend directory (ensure it's loaded)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY?.trim();

// Debug logging (remove in production)
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase configuration error:');
    console.error('   SUPABASE_URL:', supabaseUrl || 'MISSING');
    console.error('   SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Present (hidden)' : 'MISSING');
    console.error('   .env file path:', envPath);
    throw new Error('Missing Supabase URL or Service Key. Please check your .env file.');
}

console.log('✅ Supabase configured successfully');
console.log('   URL:', supabaseUrl);
console.log('   Service Key:', supabaseServiceKey.substring(0, 20) + '...');

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
