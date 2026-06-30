// GET /api/geocode?q=...
// Busca um lugar (cidade/endereço) no Nominatim do OpenStreetMap (grátis, sem chave)
// e devolve as coordenadas pro mapa centralizar. Passa por aqui (e não direto do
// navegador) pra mandar um User-Agent, como a política do Nominatim pede.
export default async function handler(req, res) {
  const q = (req.query?.q || '').toString().trim();
  if (!q) return res.status(400).json({ error: 'Digite um local pra buscar.' });

  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=json&limit=1&q=${encodeURIComponent(q)}`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Pacer/1.0 (app de pace de corrida)' },
    });
    const d = await r.json();
    if (!Array.isArray(d) || d.length === 0) {
      return res.status(404).json({ error: 'Não encontrei esse local.' });
    }
    return res.status(200).json({
      lat: parseFloat(d[0].lat),
      lng: parseFloat(d[0].lon),
      name: d[0].display_name,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Falha na busca: ' + e.message });
  }
}
