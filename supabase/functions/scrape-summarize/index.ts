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
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log('Scraping URL:', url);

    // Step 1: Fetch metadata via microlink
    let title = '';
    let description = '';
    let image = '';
    let pageContent = '';

    try {
      const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&data.content.selector=article,main,.post-content,.entry-content,#content&data.content.type=text`;
      const metaResponse = await fetch(microlinkUrl);
      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        if (metaData.status === 'success' && metaData.data) {
          title = metaData.data.title || '';
          description = metaData.data.description || '';
          image = metaData.data.image?.url || '';
          pageContent = metaData.data.content || '';
          console.log('Microlink - title:', title?.substring(0, 60));
        }
      }
    } catch (e) {
      console.log('Microlink fetch failed:', e);
    }

    // Fallback: extract info from URL
    if (!title) {
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const slug = pathParts[pathParts.length - 1];
        if (slug) {
          title = slug.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
          title = title.charAt(0).toUpperCase() + title.slice(1);
        } else {
          title = urlObj.hostname;
        }
      } catch {
        title = url;
      }
    }

    // Step 2: AI summarize + tag
    const contentToAnalyze = [
      title && `Title: ${title}`,
      description && `Description: ${description}`,
      pageContent && `Content: ${pageContent.substring(0, 12000)}`,
      `URL: ${url}`,
    ].filter(Boolean).join('\n\n');

    const AVAILABLE_TAGS = [
      'tech', 'ai', 'crypto', 'sports', 'funny', 'news', 'politics',
      'science', 'business', 'lifestyle', 'entertainment', 'education',
      'health', 'art', 'music', 'gaming', 'travel', 'food', 'motivation',
      'spiritual', 'design', 'programming', 'finance', 'productivity', 'other'
    ];

    const systemPrompt = `You are an expert content analyst. Your job is to deeply understand and accurately summarize any web document.

ANALYSIS RULES:
1. Read and comprehend the FULL document before summarizing. Never skim or rely on just the title/first paragraph.
2. Identify the ACTUAL subject matter — understand what the document is truly about, not what keywords superficially suggest.
3. Interpret all acronyms, abbreviations, and technical terms IN CONTEXT of the surrounding content. Always expand acronyms using their meaning as defined or implied by the document itself.
4. Distinguish between different concepts that may share similar names. Use the document's own context to determine the correct interpretation.
5. Capture the author's intent, main arguments, key insights, and conclusions accurately.
6. Never inject outside assumptions — summarize only what the document actually says.

Provide:
1. A detailed summary (4-8 sentences) accurately reflecting the document's actual content, arguments, and conclusions.
2. 1-3 relevant tags from: ${AVAILABLE_TAGS.join(', ')}

Respond ONLY with valid JSON:
{"summary": "your detailed summary here", "tags": ["tag1", "tag2"]}`;

    const response = await callGemini(GEMINI_API_KEY, systemPrompt, `Content to analyze:\n${contentToAnalyze}`);

    let summary = description || '';
    let tags = ['other'];

    if (response.ok) {
      const data = await response.json();
      const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      try {
        const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summary = parsed.summary || summary;
          const validTags = (parsed.tags || []).filter((t: string) =>
            AVAILABLE_TAGS.includes(t.toLowerCase())
          ).map((t: string) => t.toLowerCase());
          if (validTags.length > 0) tags = validTags;
        }
      } catch (e) {
        console.log('AI parse error:', e);
      }
    } else {
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
    }

    return new Response(JSON.stringify({
      title,
      summary,
      tags,
      image,
      description,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to scrape',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
