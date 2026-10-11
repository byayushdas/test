import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dmpwhzruutpbtmxffwoc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtcHdoenJ1dXRwYnRteGZmd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTU3NzksImV4cCI6MjEwNzI5MTc3OX0.h_LPggkEuopvhVszrdPrXyAXhlbQXLO7oyKMBVQoVaM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
