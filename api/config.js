// GET /api/config
// Entrega ao navegador as credenciais PÚBLICAS do Supabase (URL + chave anon).
// A chave anon é pública por design — o que protege os dados é o RLS (Row Level
// Security) configurado no banco, que garante que cada usuário só acessa os
// próprios registros. A chave service_role (admin) NUNCA passa por aqui.
export default function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase não configurado no servidor.' });
  }
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ supabaseUrl, supabaseAnonKey });
}
