import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, bookmarkId, content, url } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // If we have a URL but limited content, try fetching more
    let docContent = content || '';
    if (url && docContent.length < 500) {
      try {
        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&data.content.selector=article,main,.post-content,.entry-content,#content&data.content.type=text`;
        const metaResponse = await fetch(microlinkUrl);
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          if (metaData.status === 'success' && metaData.data) {
            const parts = [
              metaData.data.title && `Title: ${metaData.data.title}`,
              metaData.data.description && `Description: ${metaData.data.description}`,
              metaData.data.content && `Content: ${metaData.data.content}`,
            ].filter(Boolean);
            docContent = parts.join('\n\n');
          }
        }
      } catch (e) {
        console.log('Microlink fetch failed:', e);
      }
    }

    if (!docContent || docContent.trim().length === 0) {
      return new Response(JSON.stringify({ 
        answer: "I don't have enough content from this document to answer your question. Try re-summarizing it first." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Truncate to fit context window
    const truncatedContent = docContent.substring(0, 20000);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `You are a world-class research analyst specializing in deep document comprehension. A user has saved a web article and needs expert-level answers.

Your approach:
1. **Read thoroughly** — understand the full document before responding.
2. **Structure clearly** — use markdown: ## headers, **bold** for key terms, bullet points, and numbered lists.
3. **Cite the source** — quote or reference specific passages to support every claim.
4. **Distinguish fact from inference** — clearly separate what the document states vs. your interpretation.
5. **Be honest** — if the document doesn't cover it, say so and suggest what might help.
6. For summary/takeaway requests, structure as: **Main Thesis** → **Key Arguments** → **Evidence** → **Conclusions**.
7. Give actionable, insightful answers — don't just restate the text, add analytical depth.

IMPORTANT: Answer based ONLY on the provided document. Never fabricate information.

Document content:
${truncatedContent}`
          },
          {
            role: "user",
            content: question,
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('AI error:', response.status, errText);
      throw new Error('AI request failed');
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No answer generated.';

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Ask-doc error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to process question',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
