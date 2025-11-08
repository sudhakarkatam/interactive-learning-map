import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, level = "beginner" } = await req.json();
    
    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const obfuscate = (k?: string) => k ? `${k.slice(0,4)}…${k.slice(-4)} (len:${k.length})` : "none";
    console.log("🔑 Perplexity Key:", PERPLEXITY_API_KEY ? obfuscate(PERPLEXITY_API_KEY) : "❌ Missing");
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PERPLEXITY_API_KEY missing: set with 'supabase functions secrets set PERPLEXITY_API_KEY=your_key'" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  const systemPrompt = `You are Perplexity AI with live web search. For "${topic}", perform REAL-TIME searches and return ONLY recent, high-quality URLs from current search results.

CRITICAL RECENCY REQUIREMENTS:
- YouTube videos: MUST be recent (add "after:2020" to search queries)
- Articles: MUST have current, up-to-date content
- Add "after:2020" to ALL search queries for recency
- NO outdated or deprecated content

QUALITY & SPECIFICITY REQUIREMENTS:
- Articles MUST be from: MDN, FreeCodeCamp, Dev.to, CSS-Tricks, Smashing Magazine, official docs, W3Schools
- NO homepage URLs (e.g., youtube.com, wikipedia.org home pages)
- MUST link to SPECIFIC articles/videos for each subtopic
- Each URL must have a unique, specific path (not just /docs or /tutorial)
- NO broken links or placeholder URLs
- URLs must be accessible (no 404/500 errors)

SEARCH PROCESS FOR EACH NODE:
1. Search: "${topic} [specific subtopic] tutorial after:2020"
2. Article search: "site:developer.mozilla.org OR site:freecodecamp.org ${topic} [subtopic]"
3. YouTube search: "site:youtube.com ${topic} [subtopic] tutorial"
4. Verify YouTube video IDs are EXACTLY 11 characters
5. Ensure each URL is highly specific to the subtopic (not generic)
6. Test URLs are accessible before including

FORBIDDEN:
- Homepage URLs without specific paths: ❌ https://reactjs.org/ ✅ https://reactjs.org/docs/hooks-intro.html
- Made-up or placeholder video IDs
- Generic landing pages that don't match the subtopic
- Broken or inaccessible links (404/500)
- Same URL repeated across different nodes

EXAMPLE VALID RESOURCES:
- https://www.youtube.com/watch?v=Ke90Tje7VS0 (React tutorial, 11-char ID, accessible)
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules (specific path)
- https://www.freecodecamp.org/news/javascript-async-await-tutorial/ (specific article)

Return ONLY valid JSON:
{
  "topic": "${topic}",
  "description": "Brief overview of ${topic}",
  "branches": [
    {
      "id": "branch-1",
      "name": "Branch related to ${topic}",
      "description": "Branch description",
      "level": "${level}",
      "nodes": [
        {
          "id": "node-1-1",
          "name": "Specific ${topic} subtopic",
          "description": "Subtopic description",
          "resources": [
            {
              "title": "Real video title from YouTube",
              "url": "https://www.youtube.com/watch?v=11CHAR_IDXX",
              "type": "video"
            },
            {
              "title": "Real article from trusted source",
              "url": "https://developer.mozilla.org/specific/subtopic/path",
              "type": "article"
            }
          ],
          "estimatedHours": 5,
          "prerequisites": []
        }
      ]
    }
  ],
  "relatedTopics": ["${topic} subfield", "Related ${topic} area"]
}

VALIDATION RULES:
- NO empty resource arrays - every node must have 2-3 resources
- NO repeated URLs - each resource URL must be unique
- NO generic URLs - reject /overview, /docs, /introduction pages
- NO fake URLs - only use URLs found through fresh search
- NO unrelated content - everything must be about "${topic}"

If you cannot find sufficient real, unique URLs through fresh search, return: {"error": "Insufficient real resources found for ${topic}"}`;

    // Perplexity only
  const apiUrl = "https://api.perplexity.ai/chat/completions";
    const headers = {
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    };
    const requestBody = {
  model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a learning roadmap for "${topic}" (${level} level) with 3-4 branches, 2-3 nodes each.

IMPORTANT: Read and understand the user's request carefully. The topic is "${topic}" at ${level} level.

SEARCH THE WEB NOW with these requirements:
- Add "after:2020" to ALL search queries for recent content
- YouTube: Find videos with valid 11-char IDs that are accessible
- Articles: Find content from trusted sources (MDN, FreeCodeCamp, official docs) that load properly
- Each URL must be SPECIFIC to the subtopic with unique paths (no homepages)
- Verify YouTube video IDs are exactly 11 characters
- Ensure every URL is accessible and returns 200 status

CRITICAL: Each URL must be UNIQUE across the ENTIRE learning map. DO NOT repeat any video or article URL in multiple nodes. Each node must have completely different resources.

Include 2-3 REAL, ACCESSIBLE, UNIQUE resources per node (mix articles and YouTube videos). Return ONLY valid JSON, no markdown fences.` }
      ],
      temperature: 0.2,
      max_tokens: 10000,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON response
    type Resource = { title: string; url: string; type: string };
    type LearningNode = {
      id: string;
      name: string;
      description: string;
      resources?: Resource[];
      estimatedHours?: number;
      prerequisites?: string[];
    };
    type Branch = {
      id: string;
      name: string;
      description: string;
      level: string;
      nodes?: LearningNode[];
    };
    type LearningMap = {
      topic: string;
      description: string;
      branches?: Branch[];
      relatedTopics?: string[];
    };

    let learningMap: LearningMap;
    const extractJson = (raw: string): string | null => {
      const trimmed = raw.trim();
      // If already starts with '{' try direct
      if (trimmed.startsWith('{')) {
        // attempt to balance braces
        let depth = 0; let endIndex = -1;
        for (let i=0;i<trimmed.length;i++) {
          const ch = trimmed[i];
          if (ch === '{') depth++;
          else if (ch === '}') { depth--; if (depth === 0) { endIndex = i+1; break; } }
        }
        if (endIndex > 0) return trimmed.slice(0,endIndex);
      }
      // fallback regex
      const match = /\{[\s\S]*\}$/.exec(trimmed);
      return match ? match[0] : null;
    };
    try {
      const withoutFences = content.replace(/```json\n?|```/g, '').trim();
      const jsonCandidate = extractJson(withoutFences);
      if (!jsonCandidate) throw new Error('No JSON object found in model output');
      learningMap = JSON.parse(jsonCandidate) as LearningMap;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse learning map structure");
    }

    // Validate and sanitize URLs to avoid broken/fake links
    const isValidHttpUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        return ["http:", "https:"].includes(parsed.protocol) && !!parsed.hostname;
      } catch { return false; }
    };

    const isLikelyHomepage = (u: string) => {
      try {
        const { pathname, search } = new URL(u);
        return pathname === "/" || pathname.length <= 1 || /^(?:index\.html?)?$/.test(pathname.split("/").pop() || "") || (!pathname && !search);
      } catch { return false; }
    };

    const normalizeYouTube = (u: string) => {
      try {
        const url = new URL(u);
        if (url.hostname === "youtu.be") {
          const id = url.pathname.replace(/^\//, "");
          if (id) return `https://www.youtube.com/watch?v=${id}`;
        }
        if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/shorts/")) {
          const id = url.pathname.split("/")[2];
          if (id) return `https://www.youtube.com/watch?v=${id}`;
        }
        return u;
      } catch { return u; }
    };

    const isValidYouTube = (u: string) => {
      try {
        const url = new URL(u);
        if (!/^(?:www\.)?youtube\.com$/.test(url.hostname)) return false;
        if (url.pathname !== "/watch") return false;
        const v = url.searchParams.get("v");
        return !!v && /^[A-Za-z0-9_-]{11}$/.test(v);
      } catch { return false; }
    };

    const dedupe = <T extends { url: string }>(arr: T[]) => {
      const seen = new Set<string>();
      const out: T[] = [];
      for (const item of arr) {
        if (!seen.has(item.url)) {
          seen.add(item.url);
          out.push(item);
        }
      }
      return out;
    };

    try {
      // Traverse and sanitize
      const branches: Branch[] = Array.isArray(learningMap.branches) ? learningMap.branches : [];
      for (const branch of branches) {
        const nodes: LearningNode[] = Array.isArray(branch.nodes) ? branch.nodes : [];
        for (const node of nodes) {
          let resources: Resource[] = Array.isArray(node.resources) ? node.resources : [];
          // Normalize and filter
          resources = resources.map((r) => ({
            title: String(r.title || "Resource"),
            type: String(r.type || "article"),
            url: typeof r.url === "string" ? normalizeYouTube(r.url.trim()) : "",
          })).filter((r) => r.url && isValidHttpUrl(r.url));

          // Remove homepages/generic pages for articles
          resources = resources.filter((r) => r.type === "video" ? true : !isLikelyHomepage(r.url));

          // Validate YouTube URLs for videos
          resources = resources.filter((r) => r.type === "video" ? isValidYouTube(r.url) : true);

          // Dedupe by URL
          resources = dedupe(resources);

          // Keep 2-3 top resources if more
          if (resources.length > 3) resources = resources.slice(0, 3);

          node.resources = resources;
        }
      }

      // Global deduplication: remove duplicate URLs across the entire map
      const globalUrlSet = new Set<string>();
      let duplicatesRemoved = 0;
      for (const branch of branches) {
        for (const node of branch.nodes || []) {
          const originalCount = node.resources?.length || 0;
          node.resources = (node.resources || []).filter((r) => {
            const urlLower = r.url.toLowerCase();
            if (globalUrlSet.has(urlLower)) {
              duplicatesRemoved++;
              console.log(`Removed duplicate URL from "${node.name}": ${r.url}`);
              return false;
            }
            globalUrlSet.add(urlLower);
            return true;
          });
          if (node.resources.length < originalCount) {
            console.warn(`Node "${node.name}" had ${originalCount - node.resources.length} duplicate URLs removed`);
          }
        }
      }
      console.log(`Removed ${duplicatesRemoved} duplicate URLs across the entire map`);

      // Ensure each node has at least 1-2 resources
      const hasInsufficient = branches.some((b) => (b.nodes || []).some((n) => !n.resources || n.resources.length < 1));
      if (hasInsufficient) {
        throw new Error(`Insufficient real resources found for ${topic}`);
      }
    } catch (e) {
      console.error("Validation error:", e);
      return new Response(
        JSON.stringify({ error: e instanceof Error ? e.message : "Validation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = "perplexity" as const;
    return new Response(
      JSON.stringify({ map: learningMap, meta: { provider } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-map:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
