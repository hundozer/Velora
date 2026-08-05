import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://bkdyjdbmtucqvgebqadp.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_Bi82vTiJPZw6soseqlBCDg_9qhLVLQY";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
