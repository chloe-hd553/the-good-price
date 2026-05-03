import { createClient } from "@supabase/supabase-js";

// Variables exposées au frontend Vite (préfixe VITE_ obligatoire)
// Si elles ne sont pas encore définies dans Vercel, le build passe
// mais la connexion Supabase ne fonctionnera pas au runtime.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);
