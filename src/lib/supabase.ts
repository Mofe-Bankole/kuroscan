import {createClient} from "@supabase/supabase-js"
import config from "../config/config"

export const supabase = createClient(
    config.NODE_PUBLIC_SUPABASE_URL!,
    config.NODE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
)
