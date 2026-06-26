import { createClient } from '@supabase/supabase-js';
import { getPublicEnvironment } from '../env';

const { supabaseUrl, supabaseAnonKey } = getPublicEnvironment();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
