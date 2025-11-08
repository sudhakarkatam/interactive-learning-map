import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { topic, learningMapContext, conversationHistory = [], question } = await req.json();

    if (!question || !topic) {
      return new Response(
        JSON.stringify({ error: 'Question and topic are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'PERPLEXITY_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const model = Deno.env.get('PERPLEXITY_MODEL') || 'sonar-pro';

    const messages = [
      {
        role: 'system',
        content: `You are a helpful learning assistant. The user is learning about "${topic}". Here is their learning map context:\n\n${learningMapContext || 'No specific context provided.'}\n\nFormatting rules for EVERY answer:\n- Use concise Markdown.\n- When recommending resources, ALWAYS include clickable links in this exact format: - [Title](https://example.com) with one-line description.\n- Prefer bullet lists, short paragraphs, and section headings when useful.\n- If you cite sources with bracketed numbers like [1], also include the full link inline next to the reference.\n- Avoid footnote-only references.\n- Keep responses focused and educational.\n- If no web info is needed, still format clearly in Markdown.\n`
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({ 
        role: msg.role, 
        content: msg.content 
      })),
      { role: 'user', content: question }
    ];

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Perplexity API error: ${response.status}`,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content || 'No response generated.';

    return new Response(
      JSON.stringify({ answer, model }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in follow-up chat:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process question',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
