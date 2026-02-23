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
        maxOutputTokens: 2048,
        temperature: 0.4,
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

    // Always try to fetch full article content from the source URL
    let docContent = '';
    if (url) {
      // Method 1: Try Microlink API
      try {
        console.log('Fetching full article from:', url);
        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&data.content.selector=article,main,.post-content,.entry-content,#content,body&data.content.type=text&data.content.attr=textContent`;
        const metaResponse = await fetch(microlinkUrl, { signal: AbortSignal.timeout(10000) });
        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          if (metaData.status === 'success' && metaData.data) {
            const parts = [
              metaData.data.title && `Title: ${metaData.data.title}`,
              metaData.data.description && `Description: ${metaData.data.description}`,
              metaData.data.content && `Full Article Content:\n${metaData.data.content}`,
            ].filter(Boolean);
            const scraped = parts.join('\n\n');
            if (scraped.length > 200) {
              docContent = scraped;
              console.log(`Microlink fetched ${docContent.length} chars`);
            }
          }
        }
      } catch (e) {
        console.log('Microlink fetch failed:', e);
      }

      // Method 2: Direct HTML fetch fallback if Microlink didn't work
      if (docContent.length < 200) {
        try {
          console.log('Trying direct fetch for:', url);
          const directResponse = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
            signal: AbortSignal.timeout(10000),
          });
          if (directResponse.ok) {
            const html = await directResponse.text();
            // Strip HTML tags to get raw text
            const textContent = html
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
              .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
              .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/\s+/g, ' ')
              .trim();
            if (textContent.length > 500) {
              docContent = `Full Article Content:\n${textContent}`;
              console.log(`Direct fetch got ${docContent.length} chars`);
            }
          }
        } catch (e) {
          console.log('Direct fetch also failed:', e);
        }
      }
    }
    // Fall back to saved content if scraping didn't yield enough
    if (docContent.length < 200 && content) {
      docContent = content;
      console.log(`Using saved content: ${docContent.length} chars`);
    }

    const hasDocContent = docContent && docContent.trim().length > 0;
    const truncatedContent = hasDocContent ? docContent.substring(0, 60000) : '';

    const systemPrompt = hasDocContent
      ? `You are a precise research assistant. Answer questions about the provided document concisely and clearly.

FORMAT RULES:
- Start with a direct 1-2 sentence answer.
- Then use ## subheadings to organize different aspects of the answer.
- Under each subheading, ALWAYS use bullet points (- ) to list key points. Never write long paragraphs under a subheading.
- Leave a blank line before every ## subheading for visual separation.
- Use **bold** for key terms and names.
- Quote relevant passages from the document using > blockquotes, placed after the related bullet points.
- Keep each bullet point to 1-2 sentences max.

CONTENT RULES:
- If the document doesn't cover the question, say so in one sentence, then answer from general knowledge.
- Never repeat the question. No filler phrases.
- Be factual, direct, and well-spaced.`
      : `You are a concise and helpful assistant. No document content is available.

FORMAT RULES:
- Answer directly in 1-2 sentences first.
- Use ## subheadings for different aspects, with bullet points (- ) under each.
- Use **bold** for key terms. Keep bullets to 1-2 sentences.
- Leave blank lines between sections. No filler.
- If the question seems about a specific saved document, suggest re-summarizing the bookmark.`;

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
