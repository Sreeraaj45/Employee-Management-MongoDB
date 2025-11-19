import { supabase } from './supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set');
    
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Connection test successful:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};
