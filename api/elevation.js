// POST /api/elevation
// Recebe os vértices que o usuário clicou no mapa: { points: [{lat,lng}, ...], samples }
// 1) interpola N pontos igualmente espaçados ao longo do trajeto desenhado
// 2) pede a elevação desses pontos à Open-Meteo (API aberta, SEM chave nem billing)
// Não há mais chave do Google aqui — Open-Meteo é gratuita e pública.
const OPEN_METEO = 'https://api.open-meteo.com/v1/elevation';
const CHUNK = 100; // a Open-Meteo aceita até 100 coordenadas por chamada

function haversine(a, b) {
  const R = 6371000, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLon = toR(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Distribui n pontos igualmente espaçados ao longo da linha quebrada dos vértices.
function interpolate(vertices, n) {
  const cum = [0];
  for (let i = 1; i < vertices.length; i++) {
    cum.push(cum[i - 1] + haversine(vertices[i - 1], vertices[i]));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return vertices.slice();
  const out = [];
  let seg = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    while (seg < cum.length - 2 && cum[seg + 1] < target) seg++;
    const segLen = cum[seg + 1] - cum[seg] || 1;
    const t = (target - cum[seg]) / segLen;
    const a = vertices[seg], b = vertices[seg + 1];
    out.push({ lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) });
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }
  try {
    const { points, samples } = req.body || {};
    if (!Array.isArray(points) || points.length < 2) {
      return res.status(400).json({ error: 'Desenhe ao menos 2 pontos no mapa.' });
    }

    const n = Math.min(Math.max(parseInt(samples, 10) || 200, 2), 300);
    const path = interpolate(points.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })), n);

    // Quebra em lotes de 100 e consulta a Open-Meteo (em paralelo).
    const chunks = [];
    for (let i = 0; i < path.length; i += CHUNK) chunks.push(path.slice(i, i + CHUNK));

    const results = await Promise.all(chunks.map(async (chunk) => {
      const lat = chunk.map((p) => p.lat.toFixed(6)).join(',');
      const lng = chunk.map((p) => p.lng.toFixed(6)).join(',');
      const r = await fetch(`${OPEN_METEO}?latitude=${lat}&longitude=${lng}`);
      const d = await r.json();
      if (!r.ok || !Array.isArray(d.elevation)) {
        throw new Error(d.reason || 'resposta inválida da Open-Meteo');
      }
      return d.elevation;
    }));

    const eles = results.flat();
    const out = path.map((p, i) => ({ lat: p.lat, lng: p.lng, ele: eles[i] }));
    return res.status(200).json({ points: out });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao consultar a elevação: ' + e.message });
  }
}
