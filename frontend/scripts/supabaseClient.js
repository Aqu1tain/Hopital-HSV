// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvkdjblpkskkktlckyyg.supabase.co'; // ← colle ton URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2a2RqYmxwa3Nra2t0bGNreXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTE5OTYsImV4cCI6MjA2MzM4Nzk5Nn0.1QkCkhsxlMm_IJz0n-rKcBWuavH1dp-YJdzKlV3C0k4';          // ← colle ta clé publique

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;