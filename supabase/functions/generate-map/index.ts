import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { topic, level = "beginner", verifyUrls = true } = await req.json();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const obfuscate = (k?: string) =>
      k ? `${k.slice(0, 4)}…${k.slice(-4)} (len:${k.length})` : "none";
    console.log(
      "🔑 Perplexity Key:",
      PERPLEXITY_API_KEY ? obfuscate(PERPLEXITY_API_KEY) : "❌ Missing",
    );
    console.log(
      "🔍 URL Verification:",
      verifyUrls ? "Enabled" : "Disabled (format-only validation)",
    );
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "PERPLEXITY_API_KEY missing: set with 'supabase functions secrets set PERPLEXITY_API_KEY=your_key'",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const systemPrompt = `You are Perplexity AI with live web search capability. For "${topic}", you MUST perform REAL-TIME web searches and return ONLY URLs that currently exist and are accessible.

🔍 SEARCH REQUIREMENT: You MUST use your web search functionality to find ACTUAL, CURRENT resources for "${topic}". DO NOT generate or hallucinate URLs.

📅 RECENCY REQUIREMENTS:
- YouTube videos: Search with "after:2022" filter - ONLY videos from 2022 onwards
- Articles: MUST be current (2022+) and actively maintained
- NO outdated, deprecated, or archived content
- Prefer official documentation and verified sources

🎯 QUALITY & SPECIFICITY REQUIREMENTS:
**Trusted Sources (prioritize these):**
- Official documentation: docs.[platform].com, developer.[platform].com
- Learning platforms: FreeCodeCamp.org, dev.to, Medium.com
- Technical sites: MDN, GeeksforGeeks, TutorialsPoint, DigitalOcean
- Video platforms: YouTube.com (verified creators only)
- For IoT/Hardware: Arduino.cc, Raspberrypi.com, Hackster.io, Instructables.com
- For programming: GitHub.com (popular repos), StackOverflow.com

**URL Requirements:**
- MUST be SPECIFIC article/tutorial/video pages (NOT homepages)
- Each URL must have a UNIQUE path (no duplicates)
- YouTube videos: MUST have valid 11-character video IDs
- NO generic landing pages (/docs, /overview, /index, /home)
- NO 404 or broken links
- NO paywalled or restricted content

🔎 SEARCH STRATEGY (EXECUTE THESE SEARCHES):
For each node/subtopic, perform these searches IN ORDER:

1. **Primary Search**: "${topic} [specific subtopic] tutorial 2024"
   - Use this to find current, comprehensive tutorials

2. **Video Search**: "site:youtube.com ${topic} [subtopic] tutorial after:2022"
   - Find specific tutorial videos (verify 11-char video ID)

3. **Documentation**: "site:docs ${topic} [subtopic]"
   - Find official documentation pages

4. **Community Content**: "${topic} [subtopic] site:dev.to OR site:medium.com"
   - Find community tutorials and explanations

5. **For Niche Topics (IoT, embedded, hardware)**:
   - "arduino ${topic} [subtopic] project"
   - "raspberry pi ${topic} [subtopic] tutorial"
   - "site:hackster.io ${topic}"
   - "site:instructables.com ${topic}"

🚫 ABSOLUTELY FORBIDDEN:
- ❌ Homepage URLs: https://arduino.cc/ or https://python.org/
- ✅ Specific pages: https://docs.arduino.cc/tutorials/generic/web-server-ap-mode
- ❌ Made-up or hallucinated URLs
- ❌ Generic index/overview pages
- ❌ Duplicate URLs across different nodes
- ❌ Invalid YouTube video IDs (not 11 characters)
- ❌ URLs that don't match the topic
- ❌ Broken links (404, 500, 403 errors)

✅ VALID URL EXAMPLES:
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (11-char video ID)
- https://docs.python.org/3/tutorial/introduction.html (specific page)
- https://www.freecodecamp.org/news/learn-javascript-full-course/ (article)
- https://dev.to/aman_singh/a-beginners-guide-to-react-4pb1 (tutorial)

📋 JSON FORMAT (return ONLY this structure):
{
  "topic": "${topic}",
  "description": "Brief, informative overview of ${topic} (2-3 sentences)",
  "branches": [
    {
      "id": "branch-1",
      "name": "Branch name related to ${topic}",
      "description": "What learners will gain from this branch",
      "level": "${level}",
      "nodes": [
        {
          "id": "node-1-1",
          "name": "Specific ${topic} subtopic",
          "description": "Detailed explanation of this subtopic",
          "resources": [
            {
              "title": "Actual title from the web page/video",
              "url": "https://www.youtube.com/watch?v=VALID11CHAR",
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
        {
          role: "user",
          content: `Generate a comprehensive learning roadmap for "${topic}" at ${level} level.

📋 REQUIREMENTS:
- Create 3-4 main learning branches
- Each branch: 2-3 learning nodes
- Each node: 2-3 REAL, VERIFIED resources (mix of articles and videos)

🔍 CRITICAL SEARCH INSTRUCTIONS:
You MUST use your web search capability RIGHT NOW to find ACTUAL resources. Follow these steps:

1. **Search for each subtopic individually**: For every node you create, perform a web search
2. **Use recency filters**: Add "after:2022" to all searches for current content
3. **Verify YouTube videos**: Ensure video IDs are EXACTLY 11 characters
4. **Check URL specificity**: Every URL must point to a SPECIFIC article/tutorial/video (NOT homepages)
5. **Ensure uniqueness**: Each URL must appear ONLY ONCE in the entire learning map
6. **Validate accessibility**: Only include URLs that are currently accessible

🎯 SEARCH EXAMPLES FOR "${topic}":
- General: "${topic} [subtopic] tutorial 2024"
- YouTube: "site:youtube.com ${topic} [subtopic] tutorial after:2022"
- Documentation: "${topic} [subtopic] official documentation"
- Tutorials: "${topic} [subtopic] site:freecodecamp.org OR site:dev.to"

⚠️ STRICT VALIDATION:
- NO duplicate URLs across the entire map
- NO homepage URLs (e.g., https://example.com/ is INVALID)
- NO generic pages (e.g., /docs, /overview, /index)
- NO made-up or hallucinated URLs
- ONLY URLs from your ACTUAL web search results
- Every YouTube URL must match: https://www.youtube.com/watch?v=[11-char-ID]

🎨 OUTPUT FORMAT:
Return ONLY valid JSON without markdown code fences or any other formatting. The JSON must be parseable directly.`,
        },
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
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI service payment required. Please contact support.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.message?.reasoning;

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
      if (trimmed.startsWith("{")) {
        // attempt to balance braces
        let depth = 0;
        let endIndex = -1;
        for (let i = 0; i < trimmed.length; i++) {
          const ch = trimmed[i];
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth === 0) {
              endIndex = i + 1;
              break;
            }
          }
        }
        if (endIndex > 0) return trimmed.slice(0, endIndex);
      }
      // fallback regex
      const match = /\{[\s\S]*\}$/.exec(trimmed);
      return match ? match[0] : null;
    };
    try {
      const withoutFences = content.replace(/```json\n?|```/g, "").trim();
      const jsonCandidate = extractJson(withoutFences);
      if (!jsonCandidate)
        throw new Error("No JSON object found in model output");
      learningMap = JSON.parse(jsonCandidate) as LearningMap;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse learning map structure");
    }

    // Validate and sanitize URLs to avoid broken/fake links
    const isValidHttpUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        return (
          ["http:", "https:"].includes(parsed.protocol) && !!parsed.hostname
        );
      } catch {
        return false;
      }
    };

    const isLikelyHomepage = (u: string) => {
      try {
        const { pathname, search } = new URL(u);
        return (
          pathname === "/" ||
          pathname.length <= 1 ||
          /^(?:index\.html?)?$/.test(pathname.split("/").pop() || "") ||
          (!pathname && !search)
        );
      } catch {
        return false;
      }
    };

    const normalizeYouTube = (u: string) => {
      try {
        const url = new URL(u);
        if (url.hostname === "youtu.be") {
          const id = url.pathname.replace(/^\//, "");
          if (id) return `https://www.youtube.com/watch?v=${id}`;
        }
        if (
          url.hostname.includes("youtube.com") &&
          url.pathname.startsWith("/shorts/")
        ) {
          const id = url.pathname.split("/")[2];
          if (id) return `https://www.youtube.com/watch?v=${id}`;
        }
        return u;
      } catch {
        return u;
      }
    };

    const isValidYouTube = (u: string) => {
      try {
        const url = new URL(u);
        if (!/^(?:www\.)?youtube\.com$/.test(url.hostname)) return false;
        if (url.pathname !== "/watch") return false;
        const v = url.searchParams.get("v");
        return !!v && /^[A-Za-z0-9_-]{11}$/.test(v);
      } catch {
        return false;
      }
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

    // URL verification function
    const verifyUrl = async (url: string): Promise<boolean> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        let response = await fetch(url, {
          method: "HEAD",
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        // If HEAD fails, try GET
        if (!response.ok) {
          const getController = new AbortController();
          const getTimeoutId = setTimeout(() => getController.abort(), 5000);
          response = await fetch(url, {
            method: "GET",
            redirect: "follow",
            signal: getController.signal,
          });
          clearTimeout(getTimeoutId);
        }

        const isOk =
          response.ok && response.status >= 200 && response.status < 400;
        if (!isOk) {
          console.log(`❌ Verification failed for ${url}: ${response.status}`);
        }
        return isOk;
      } catch (error) {
        console.log(
          `❌ Verification error for ${url}:`,
          error instanceof Error ? error.message : "Unknown",
        );
        return false;
      }
    };

    // Parallel verification helper
    const verifyUrlsInParallel = async (
      urls: string[],
      concurrency = 10,
    ): Promise<boolean[]> => {
      const results: boolean[] = new Array(urls.length).fill(false);
      const queue = urls.map((url, index) => ({ url, index }));

      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (item) {
            results[item.index] = await verifyUrl(item.url);
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(concurrency, urls.length) }, () =>
          worker(),
        ),
      );
      return results;
    };

    // Initialize verification tracking variables
    let totalUrls = 0;
    let verifiedUrls = 0;

    try {
      // Traverse and sanitize
      const branches: Branch[] = Array.isArray(learningMap.branches)
        ? learningMap.branches
        : [];

      for (const branch of branches) {
        const nodes: LearningNode[] = Array.isArray(branch.nodes)
          ? branch.nodes
          : [];
        for (const node of nodes) {
          let resources: Resource[] = Array.isArray(node.resources)
            ? node.resources
            : [];
          // Normalize and filter
          resources = resources
            .map((r) => ({
              title: String(r.title || "Resource"),
              type: String(r.type || "article"),
              url:
                typeof r.url === "string" ? normalizeYouTube(r.url.trim()) : "",
            }))
            .filter((r) => r.url && isValidHttpUrl(r.url));

          // Remove homepages/generic pages for articles
          resources = resources.filter((r) =>
            r.type === "video" ? true : !isLikelyHomepage(r.url),
          );

          // Validate YouTube URLs for videos
          resources = resources.filter((r) =>
            r.type === "video" ? isValidYouTube(r.url) : true,
          );

          // Dedupe by URL
          resources = dedupe(resources);

          // Verify URLs are accessible (optional, enabled via request param)
          if (verifyUrls && resources.length > 0) {
            const urls = resources.map((r) => r.url);
            totalUrls += urls.length;
            const verificationResults = await verifyUrlsInParallel(urls, 10);
            resources = resources.filter(
              (_, index) => verificationResults[index],
            );
            verifiedUrls += resources.filter(
              (_, index) => verificationResults[index],
            ).length;

            console.log(
              `✓ Verified ${resources.length}/${urls.length} URLs for node "${node.name}"`,
            );
          }

          // Keep 2-3 top resources if more
          if (resources.length > 3) resources = resources.slice(0, 3);

          node.resources = resources;
        }
      }

      if (verifyUrls) {
        const verificationRate =
          totalUrls > 0 ? Math.round((verifiedUrls / totalUrls) * 100) : 0;
        console.log(
          `📊 Total URL verification: ${verifiedUrls}/${totalUrls} (${verificationRate}%)`,
        );

        if (totalUrls > 0 && verifiedUrls / totalUrls < 0.5) {
          console.warn(
            `⚠️ Low verification rate: only ${verifiedUrls}/${totalUrls} URLs verified`,
          );
          console.warn(
            `💡 This may indicate the AI generated invalid URLs. Consider retrying.`,
          );
        }
      } else {
        console.log(
          `⚡ Fast mode: URL verification skipped (not recommended for production)`,
        );
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
              console.log(
                `Removed duplicate URL from "${node.name}": ${r.url}`,
              );
              return false;
            }
            globalUrlSet.add(urlLower);
            return true;
          });
          if (node.resources.length < originalCount) {
            console.warn(
              `Node "${node.name}" had ${originalCount - node.resources.length} duplicate URLs removed`,
            );
          }
        }
      }
      console.log(
        `Removed ${duplicatesRemoved} duplicate URLs across the entire map`,
      );

      // Ensure each node has at least 1-2 resources
      const hasInsufficient = branches.some((b) =>
        (b.nodes || []).some((n) => !n.resources || n.resources.length < 1),
      );
      if (hasInsufficient) {
        console.error(`❌ Some nodes have insufficient resources`);
        throw new Error(
          `Insufficient real resources found for ${topic}. The AI may have failed to perform web searches. Please try again.`,
        );
      }

      // Log statistics
      const totalNodes = branches.reduce(
        (sum, b) => sum + (b.nodes?.length || 0),
        0,
      );
      const totalResources = branches.reduce(
        (sum, b) =>
          sum +
          (b.nodes?.reduce((nSum, n) => nSum + (n.resources?.length || 0), 0) ||
            0),
        0,
      );
      console.log(
        `📚 Generated ${branches.length} branches, ${totalNodes} nodes, ${totalResources} resources`,
      );
    } catch (e) {
      console.error("Validation error:", e);
      return new Response(
        JSON.stringify({
          error: e instanceof Error ? e.message : "Validation failed",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const provider = "perplexity" as const;
    return new Response(
      JSON.stringify({
        map: learningMap,
        meta: {
          provider,
          verified: verifyUrls,
          verificationRate:
            totalUrls > 0 ? Math.round((verifiedUrls / totalUrls) * 100) : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in generate-map:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
