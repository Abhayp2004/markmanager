import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GEMINI_MODEL = "gemini-2.5-flash";

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 4096,
      },
    }),
  });
  return response;
}

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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
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

    const truncatedContent = docContent.substring(0, 30000);

    const systemPrompt = `You are a world-class research analyst specializing in deep document comprehension. A user has saved a web article and needs expert-level answers.

Your approach:
1. **Read thoroughly** — understand the full document before responding.
2. **Structure clearly** — use markdown: ## headers, **bold** for key terms, bullet points, and numbered lists.
3. **Cite the source** — quote or reference specific passages to support every claim.
4. **Distinguish fact from inference** — clearly separate what the document states vs. your interpretation.
5. **Be honest** — if the document doesn't cover it, say so and suggest what might help.
6. For summary/takeaway requests, structure as: **Main Thesis** → **Key Arguments** → **Evidence** → **Conclusions**.
7. Give actionable, insightful answers — don't just restate the text, add analytical depth.

IMPORTANT: Answer based ONLY on the provided document. Never fabricate information.`;

    const userPrompt = `Document content:\n${truncatedContent}\n\nUser question: ${question}`;

    const response = await callGemini(GEMINI_API_KEY, systemPrompt, userPrompt);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
      throw new Error('AI request failed');
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer generated.';

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
