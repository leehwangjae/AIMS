export default function handler(req, res) {
  const supabaseUrl = process.env.AIMS_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.AIMS_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.status(200).send(`window.AIMS_SUPABASE_URL = ${JSON.stringify(supabaseUrl)};\nwindow.AIMS_SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};\nwindow.AIMS_SUPABASE_CONFIG_LOADED = true;`);
}
