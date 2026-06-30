# Pacer

App (PWA) que lê o relevo de um trajeto de corrida e monta o pace ideal por trecho com IA.
Tem landing page de apresentação, login com Google, desafios, calendário, finanças, playlist e mais.

## Estrutura

```
api/                  Backend (funções serverless da Vercel) — escondem as chaves
  config.js           GET  -> entrega URL + chave anon do Supabase ao navegador
  elevation.js        POST -> altimetria do trajeto (Open-Meteo, sem chave)
  geocode.js          GET  -> busca de lugares (Nominatim, sem chave)
  plan.js             POST -> IA do plano/treino (Groq)
public/
  index.html          Landing page (apresentação) — rota /
  app.html            O app de verdade — rota /app.html
  manifest.webmanifest / sw.js / icons/   PWA instalável
```

## Variáveis de ambiente (3)

| Variável | Para quê | Onde fica |
|---|---|---|
| `GROQ_API_KEY` | IA (estratégia e treino) | Só no servidor |
| `SUPABASE_URL` | Login + banco | Pública (vai ao navegador) |
| `SUPABASE_ANON_KEY` | Login + banco | Pública; o RLS protege os dados |

Mapa (OpenStreetMap), relevo e clima (Open-Meteo) e busca (Nominatim) são gratuitos e não usam chave.

## Deploy (GitHub + Vercel)

1. Suba este repositório pro GitHub.
2. Na Vercel: **Add New > Project** > importe o repo.
3. Em **Environment Variables**, adicione as 3 variáveis acima (os valores estão no seu `.env.local`).
4. **Deploy.** Você recebe uma URL `https://...vercel.app`.
5. **Religue o login pro domínio novo** — Supabase > Authentication > URL Configuration:
   - **Site URL:** sua URL da Vercel.
   - **Redirect URLs:** adicione `https://SUA-URL.vercel.app/**`.

## Desativar tudo no fim (sem risco de cobrança)

- **Vercel:** Settings > General > Delete Project (tira o site do ar).
- **Groq:** console.groq.com > API Keys > apague a chave.
- **Supabase:** apague o projeto em Project Settings.
- (As chaves do Google/Strava/Spotify que chegaram a ser criadas durante os testes podem ser apagadas nos respectivos painéis — não são usadas.)

## Rodar local (dev)

`python3 devserver.py` e abra `http://localhost:8000`. As chaves vêm de um arquivo `.env.local`
(não versionado). O `devserver.py` espelha as funções da Vercel para testes locais.
