// POST /api/plan
// Recebe o prompt já montado pelo frontend ({ prompt }) e chama a IA do Groq.
// A API do Groq é compatível com o formato da OpenAI (chat/completions).
// A chave do Groq fica só aqui no servidor — substitui a chamada direta à Anthropic
// do protótipo, que não funcionaria depois de hospedado.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GROQ_API_KEY não configurada no servidor.' });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt ausente.' });
    }

    const r = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        // Groq fica atrás do Cloudflare; um User-Agent explícito evita bloqueio (erro 1010).
        'User-Agent': 'Pacer/1.0',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        temperature: 0.6,
        // Garante que a resposta venha como JSON válido (o prompt pede o mesmo formato).
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: `IA (Groq) ${r.status}: ${t.slice(0, 300)}` });
    }

    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'Falha na IA: ' + e.message });
  }
}
