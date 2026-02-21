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

    const hasDocContent = docContent && docContent.trim().length > 0;
    const truncatedContent = hasDocContent ? docContent.substring(0, 30000) : '';

    const systemPrompt = hasDocContent
      ? `You are a world-class research analyst and knowledgeable assistant. A user has saved a web article and may ask questions about it — or about anything else.

DOCUMENT-RELATED QUESTIONS (your primary mode):
1. **Read thoroughly** — understand the full document before responding.
2. **Structure clearly** — use markdown: ## headers, **bold** for key terms, bullet points, and numbered lists.
3. **Cite the source** — quote or reference specific passages to support every claim.
4. **Distinguish fact from inference** — clearly separate what the document states vs. your interpretation.
5. **Be honest** — if the document doesn't cover something, say so clearly.
6. For summary/takeaway requests, structure as: **Main Thesis** → **Key Arguments** → **Evidence** → **Conclusions**.

GENERAL QUESTIONS (secondary mode):
- If the user's question is clearly unrelated to the document, answer it using your general knowledge.
- Still use clear markdown formatting and structured responses.
- Be helpful, accurate, and concise.

IMPORTANT: When document content is available, always check if the question relates to it first. Only fall back to general knowledge if it clearly doesn't.`
      : `You are a knowledgeable and helpful assistant. The user is asking a question in the context of a saved bookmark, but no document content is available.

- Answer the question using your general knowledge.
- Use clear markdown formatting: ## headers, **bold**, bullet points, numbered lists.
- Be accurate, helpful, and concise.
- If the question seems to be about a specific document you don't have access to, let the user know and suggest re-summarizing the bookmark first.`;

    const userPrompt = truncatedContent
      ? `Document content:\n${truncatedContent}\n\nUser question: ${question}`
      : `User question: ${question}`;

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
