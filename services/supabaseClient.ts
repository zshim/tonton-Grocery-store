import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lmaldbbftklgrzcoztqg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KlHzlm2axkTHXXD5wZaAbQ_xdmntv9S';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);