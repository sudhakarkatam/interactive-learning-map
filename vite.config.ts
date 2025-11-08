import { defineConfig, loadEnv, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (not only VITE_*) so server middleware can access secrets in dev
  const env = loadEnv(mode, process.cwd(), "");
  const PPLX_KEY = env.PERPLEXITY_API_KEY;
  // Updated Perplexity models (2025)
  const allowedModels = [
    'sonar',
    'sonar-pro',
    'sonar-reasoning',
    'sonar-reasoning-pro',
    'sonar-deep-research'
  ];
  const configuredModel = env.VITE_PERPLEXITY_MODEL || env.PERPLEXITY_MODEL || '';
  const MODEL = allowedModels.includes(configuredModel) ? configuredModel : 'sonar-pro';
  if (configuredModel && !allowedModels.includes(configuredModel)) {
    console.warn(`[Perplexity Proxy] Provided model "${configuredModel}" is not in allowed list; falling back to ${MODEL}`);
  } else {
    console.log(`[Perplexity Proxy] Using model: ${MODEL}`);
  }
  return {
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Dev-only Perplexity proxy to avoid exposing API key to browser
    (mode === 'development' ? {
      name: 'perplexity-proxy',
      configureServer(server: ViteDevServer) {
  server.middlewares.use('/api/perplexity-map', async (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          interface IncomingBody { topic?: string; level?: string; }
          let body: IncomingBody = {};
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as IncomingBody; } catch { /* ignore parse error */ }
          const { topic, level = 'beginner' } = body || {};
          if (!topic) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Topic is required' }));
            return;
          }
          // Provider selection: Perplexity only (has web search)
          const usingPerplexity = !!PPLX_KEY;
          if (!usingPerplexity) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'PERPLEXITY_API_KEY not set. Please add it to your .env file.' }));
            return;
          }
          const systemPrompt = `You are a learning roadmap generator with LIVE WEB SEARCH capability. You MUST search the web in real-time and return ONLY recent, high-quality URLs from CURRENT sources.

CRITICAL RECENCY REQUIREMENTS:
- YouTube videos: MUST be recent (add "after:2020" to search queries)
- Articles: MUST be from trusted sources with current content
- Search strategy: Add "after:2020" or recent year to force up-to-date results
- NO outdated tutorials or deprecated content

QUALITY REQUIREMENTS:
- Articles MUST be from: MDN, FreeCodeCamp, Dev.to, CSS-Tricks, Smashing Magazine, official docs, W3Schools
- NO homepage URLs (e.g., youtube.com, wikipedia.org) - MUST link to specific articles/videos
- NO broken links or placeholder URLs
- Each resource MUST be highly specific to the subtopic (not generic landing pages)
- Ensure URLs are accessible and return 200 status codes

Step-by-step process for EACH node:
1. Search the web with recency filter: "${topic} [subtopic] tutorial after:2020"
2. Find 2-3 REAL article URLs from trusted sources with specific paths (e.g., /docs/specific-topic)
3. Search YouTube specifically: "site:youtube.com ${topic} [subtopic] tutorial"
4. Find 1-2 RECENT YouTube videos with actual 11-character video IDs
5. Extract actual titles from search results (not generic ones)
6. Verify each YouTube URL: https://www.youtube.com/watch?v=[EXACTLY_11_CHARS]
7. Test that URLs are accessible (not 404/500)

FORBIDDEN:
- Homepage URLs without specific paths (e.g., https://reactjs.org/ ❌, https://reactjs.org/docs/hooks-intro.html ✅)
- Made-up or placeholder video IDs
- Generic URLs that don't match the subtopic
- Broken or inaccessible links (404, 500, timeouts)
- Repeated URLs across different nodes

EXAMPLE GOOD RESOURCES:
- https://www.youtube.com/watch?v=Ke90Tje7VS0 (React Tutorial, valid 11-char ID, accessible)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules (specific MDN path, accessible)
- https://www.freecodecamp.org/news/javascript-async-await-tutorial/ (specific article, accessible)

Return ONLY valid JSON:
{
  "topic": "${topic}",
  "description": "Brief overview",
  "branches": [
    {
      "id": "branch-1",
      "name": "Main concept",
      "description": "What this covers",
      "level": "${level}",
      "nodes": [
        {
          "id": "node-1-1",
          "name": "Specific subtopic",
          "description": "Details",
          "resources": [
            {"title": "Actual recent video title", "url": "https://www.youtube.com/watch?v=11CHARIDXX", "type": "video"},
            {"title": "Actual article title from trusted source", "url": "https://developer.mozilla.org/specific/path", "type": "article"}
          ],
          "estimatedHours": 5,
          "prerequisites": []
        }
      ]
    }
  ],
  "relatedTopics": ["Topic 1", "Topic 2"]
}`;

          const buildRequestBody = (model: string) => ({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Generate a learning roadmap for "${topic}" (${level} level) with 3-4 branches, 2-3 nodes each. 

IMPORTANT: Read and understand the user's request carefully. The topic is "${topic}" at ${level} level.

SEARCH THE WEB NOW with these requirements:
- Add "after:2020" to searches for recent content
- YouTube: Find videos with valid 11-char IDs that are accessible
- Articles: Find content from trusted sources (MDN, FreeCodeCamp, official docs) that are accessible
- Each URL must be SPECIFIC to the subtopic (no homepage URLs)
- Verify all URLs are accessible (no 404/500 errors)
- Test that YouTube videos exist and articles load properly

CRITICAL: Each URL must be UNIQUE across the ENTIRE learning map. DO NOT repeat any video or article URL in multiple nodes. Each node must have completely different resources.

Include 2-3 REAL, ACCESSIBLE, UNIQUE resources per node (mix articles and YouTube videos). Return ONLY the JSON.` }
            ],
            temperature: 0.2,
            max_tokens: 10000,
          });
          try {
            let apiResp: Response | null = null;
            let usedModel: string | null = null;
            let lastErrorText = '';
            let provider = 'perplexity';
            
            // Try Perplexity first (has web search for real URLs)
            if (usingPerplexity) {
              console.log(`[Map Proxy] Using Perplexity with web search for real URLs`);
              provider = 'perplexity';
              const key = PPLX_KEY!;
              const candidates = [MODEL, ...allowedModels.filter(m => m !== MODEL)];
              for (const m of candidates) {
                console.log(`[Map Proxy] Trying Perplexity model: ${m}`);
                const r = await fetch('https://api.perplexity.ai/chat/completions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(buildRequestBody(m))
                });
                if (r.ok) { apiResp = r as unknown as Response; usedModel = m; break; }
                const t = await r.text();
                lastErrorText = t;
                console.warn(`[Map Proxy] Perplexity model ${m} failed with ${r.status}: ${t.slice(0,160)}`);
                if (!(r.status === 400 && /model|Invalid/i.test(t))) { apiResp = r as unknown as Response; break; }
              }
              if (!apiResp || !apiResp.ok) {
                const status = apiResp?.status || 500;
                const details = lastErrorText || (apiResp ? await apiResp.text() : '');
                res.statusCode = status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Perplexity error', status, details, triedModels: candidates }));
                return;
              }
            }
            interface PerplexityChoice { message?: { content?: string; reasoning?: string } }
            interface PerplexityResponse { choices?: PerplexityChoice[] }
            if (!apiResp) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal proxy error: no response object', provider }));
              return;
            }
            const data: PerplexityResponse = await apiResp.json() as PerplexityResponse;
            // Prefer content; fallback to reasoning if present
            const content: string | undefined = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;
            console.log(`[Map Proxy] Received response from ${provider}, content length: ${content?.length || 0}`);
            if (!content) {
              console.error('[Map Proxy] No content in response:', JSON.stringify(data).slice(0, 600));
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `No content received from ${provider}`, details: JSON.stringify(data).slice(0, 400) }));
              return;
            }
            const extractJson = (raw: string): string | null => {
              const trimmed = raw.trim().replace(/```json\n?|```/g, '').trim();
              if (trimmed.startsWith('{')) {
                let depth = 0; let endIndex = -1;
                for (let i=0;i<trimmed.length;i++) { const ch = trimmed[i]; if (ch==='{' ) depth++; else if (ch==='}') { depth--; if (depth===0){ endIndex=i+1; break; } } }
                if (endIndex>0) return trimmed.slice(0,endIndex);
              }
              const match = /\{[\s\S]*\}$/.exec(trimmed);
              return match ? match[0] : null;
            };
            const jsonCandidate = extractJson(content);
            if (!jsonCandidate) {
              console.error('[Map Proxy] Failed to extract JSON. Raw content:', content.substring(0, 500));
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to extract JSON from model output', preview: content.substring(0, 200) }));
              return;
            }
            interface Resource { title: string; url: string; type: string }
            interface Node { id?: string; name?: string; description?: string; resources?: Resource[]; estimatedHours?: number; prerequisites?: string[] }
            interface Branch { id?: string; name?: string; description?: string; level?: string; nodes?: Node[] }
            interface LearningMap { topic?: string; description?: string; branches?: Branch[]; relatedTopics?: string[] }

            let mapObj: LearningMap;
            try { mapObj = JSON.parse(jsonCandidate) as LearningMap; } catch (e) {
              console.error('[Map Proxy] JSON parse error:', e);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'JSON parse failed', raw: jsonCandidate.substring(0, 500) }));
              return;
            }
            console.log(`[Map Proxy] Successfully parsed map with ${mapObj.branches?.length || 0} branches`);
            // URL cleaning + verification
            const validUrl = (u: string) => { try { const p = new URL(u); return ['http:','https:'].includes(p.protocol); } catch { return false; } };
            const normalizeYT = (u: string) => { try { const url = new URL(u); if (url.hostname==='youtu.be'){ const id=url.pathname.slice(1); return id?`https://www.youtube.com/watch?v=${id}`:u; } if (url.hostname.includes('youtube.com') && url.pathname.startsWith('/shorts/')) { const id=url.pathname.split('/')[2]; if (id) return `https://www.youtube.com/watch?v=${id}`; } return u; } catch { return u; } };
            const isHomepage = (u: string) => { try { const url = new URL(u); return (url.pathname==='/' || url.pathname==='') && !url.search; } catch { return false; } };
            const dedupe = (arr: Resource[]) => { const seen = new Set<string>(); const out: Resource[] = []; for (const r of arr){ const k=(r.url||'').toLowerCase(); if (k && !seen.has(k)){ seen.add(k); out.push(r);} } return out; };
            const verifyUrl = async (u: string): Promise<boolean> => {
              if (!validUrl(u) || isHomepage(u)) return false;
              const controller = new AbortController();
              const timer = setTimeout(() => controller.abort(), 5000); // Increased timeout
              try {
                let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
                if (r.status === 405 || r.status === 501) {
                  // Some servers don't support HEAD, try GET
                  r = await fetch(u, { method: 'GET', redirect: 'follow', signal: controller.signal });
                }
                const ok = r.status >= 200 && r.status < 400;
                if (!ok) console.warn(`[URL Verify] Failed ${r.status} for ${u}`);
                return ok;
              } catch (e) { 
                console.warn(`[URL Verify] Error for ${u}:`, (e as Error).message);
                return false; 
              }
              finally { clearTimeout(timer); }
            };
            const withLimit = async <T,>(items: T[], max: number, fn: (item: T) => Promise<void>) => {
              let idx = 0; const workers: Promise<void>[] = [];
              const work = async () => { while (idx < items.length) { const i = idx++; await fn(items[i]); } };
              for (let i=0;i<Math.min(max, items.length);i++) workers.push(work());
              await Promise.all(workers);
            };
            let verified = 0; let total = 0;
            for (const b of mapObj.branches || []) {
              for (const n of b.nodes || []) {
                if (!Array.isArray(n.resources)) continue;
                n.resources = n.resources
                  .map((r: Resource) => ({ title: r.title || 'Resource', type: r.type || 'article', url: typeof r.url === 'string' ? normalizeYT(r.url.trim()) : '' }))
                  .filter((r: Resource) => r.url && validUrl(r.url) && !isHomepage(r.url));
                n.resources = dedupe(n.resources);
                total += n.resources.length;
                const keep = new Array(n.resources.length).fill(false);
                await withLimit(n.resources.map((_, i) => i), 10, async (i) => { const ok = await verifyUrl(n.resources![i].url); keep[i]=ok; if (ok) verified++; });
                n.resources = n.resources.filter((_, i) => keep[i]);
                // Ensure at least 2 resources per node
                if (n.resources.length < 2) {
                  console.warn(`[Map Proxy] Node "${n.name}" has only ${n.resources.length} verified resources`);
                }
              }
            }
            
            // Global deduplication: remove duplicate URLs across the entire map
            const globalUrlSet = new Set<string>();
            let duplicatesRemoved = 0;
            for (const b of mapObj.branches || []) {
              for (const n of b.nodes || []) {
                if (!Array.isArray(n.resources)) continue;
                const originalCount = n.resources.length;
                n.resources = n.resources.filter((r: Resource) => {
                  const urlLower = r.url.toLowerCase();
                  if (globalUrlSet.has(urlLower)) {
                    duplicatesRemoved++;
                    console.log(`[Map Proxy] Removed duplicate URL from "${n.name}": ${r.url}`);
                    return false;
                  }
                  globalUrlSet.add(urlLower);
                  return true;
                });
                if (n.resources.length < originalCount) {
                  console.warn(`[Map Proxy] Node "${n.name}" had ${originalCount - n.resources.length} duplicate URLs removed`);
                }
              }
            }
            console.log(`[Map Proxy] Verified ${verified}/${total} resource URLs (${Math.round(verified/total*100)}%)`);
            console.log(`[Map Proxy] Removed ${duplicatesRemoved} duplicate URLs across the entire map`);
            // If verification rate is too low, warn
            if (total > 0 && verified / total < 0.7) {
              console.warn(`[Map Proxy] Low verification rate: ${verified}/${total}. Many URLs may be inaccessible.`);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            console.log(`[Map Proxy] Returning enriched map with ${mapObj.branches?.length || 0} branches via ${provider}`);
            res.end(JSON.stringify({ map: mapObj, meta: { provider, localProxy: true, model: usedModel || MODEL, linkVerification: { verified, total } } }));
          } catch (err) {
            console.error('[Map Proxy] Unhandled error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Unhandled proxy error', message: (err as Error).message }));
          }
        });

        // Follow-up chat endpoint
        server.middlewares.use('/api/perplexity-chat', async (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          interface ChatBody { topic?: string; learningMapContext?: string; conversationHistory?: Array<{role: string; content: string}>; question?: string; }
          let body: ChatBody = {};
          try { body = JSON.parse(Buffer.concat(chunks).toString('utf-8')) as ChatBody; } catch { /* ignore */ }
          const { topic, learningMapContext, conversationHistory = [], question } = body || {};
          
          if (!question || !topic) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Question and topic are required' }));
            return;
          }

          if (!PPLX_KEY) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'PERPLEXITY_API_KEY not set' }));
            return;
          }

          try {
            const messages = [
              {
                role: 'system',
                content: `You are a helpful learning assistant. The user is learning about "${topic}". Here is their learning map context:\n\n${learningMapContext || 'No specific context provided.'}\n\nFormatting rules for EVERY answer:\n- Use concise Markdown.\n- When recommending resources, ALWAYS include clickable links in this exact format: - [Title](https://example.com) with one-line description.\n- Prefer bullet lists, short paragraphs, and section headings when useful.\n- If you cite sources with bracketed numbers like [1], also include the full link inline next to the reference.\n- Avoid footnote-only references.\n- Keep responses focused and educational.\n- If no web info is needed, still format clearly in Markdown.\n`
              },
              ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
              { role: 'user', content: question }
            ];

            const pplxResp = await fetch('https://api.perplexity.ai/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PPLX_KEY}`
              },
              body: JSON.stringify({
                model: MODEL,
                messages,
                temperature: 0.3,
                max_tokens: 2000,
              })
            });

            if (!pplxResp.ok) {
              const errText = await pplxResp.text();
              console.error('[Chat Proxy] Perplexity error:', pplxResp.status, errText);
              throw new Error(`Perplexity API error: ${pplxResp.status}`);
            }

            const pplxData = await pplxResp.json();
            const answer = (pplxData as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content || 'No response generated.';

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ answer, model: MODEL }));
          } catch (err) {
            console.error('[Chat Proxy] Error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Chat proxy error', message: (err as Error).message }));
          }
        });
      }
    } : null)
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}});
