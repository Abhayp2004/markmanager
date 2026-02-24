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

// Fetch with timeout and retry
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2, timeoutMs = 10000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) return response;
      // If server error, retry; if client error, don't
      if (response.status >= 500 && attempt < retries) {
        console.log(`Retry ${attempt + 1} for ${url} (status ${response.status})`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return response;
    } catch (e) {
      if (attempt < retries) {
        console.log(`Retry ${attempt + 1} for ${url}: ${e.message}`);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Failed after ${retries + 1} attempts`);
}

// Strategy 1: Microlink API
async function scrapeMicrolink(url: string): Promise<{ title: string; description: string; image: string; content: string } | null> {
  try {
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&data.content.selector=article,main,.post-content,.entry-content,#content&data.content.type=text`;
    const response = await fetchWithRetry(microlinkUrl, {}, 1, 15000);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        console.log('Microlink success - title:', data.data.title?.substring(0, 60));
        return {
          title: data.data.title || '',
          description: data.data.description || '',
          image: data.data.image?.url || '',
          content: data.data.content || '',
        };
      }
    }
  } catch (e) {
    console.log('Microlink failed:', e.message);
  }
  return null;
}

// Strategy 2: noembed (works for many sites)
async function scrapeNoembed(url: string): Promise<{ title: string; description: string; image: string; content: string } | null> {
  try {
    const response = await fetchWithRetry(`https://noembed.com/embed?url=${encodeURIComponent(url)}`, {}, 1, 8000);
    if (response.ok) {
      const data = await response.json();
      if (data.title) {
        console.log('noembed success - title:', data.title?.substring(0, 60));
        return {
          title: data.title || '',
          description: '',
          image: data.thumbnail_url || '',
          content: '',
        };
      }
    }
  } catch (e) {
    console.log('noembed failed:', e.message);
  }
  return null;
}

// Strategy 3: Direct HTML fetch + parse meta tags
async function scrapeDirectHtml(url: string): Promise<{ title: string; description: string; image: string; content: string } | null> {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarkManager/1.0; +https://markmanager.app)',
        'Accept': 'text/html',
      },
    }, 1, 12000);
    if (response.ok) {
      const html = await response.text();
      // Extract meta tags
      const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
      const imageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      
      // Extract body text (strip tags, take first chunk)
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodyText = '';
      if (bodyMatch) {
        bodyText = bodyMatch[1]
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);
      }

      const title = titleMatch?.[1] || '';
      if (title || descMatch?.[1] || bodyText) {
        console.log('Direct HTML success - title:', title?.substring(0, 60));
        return {
          title,
          description: descMatch?.[1] || '',
          image: imageMatch?.[1] || '',
          content: bodyText,
        };
      }
    }
  } catch (e) {
    console.log('Direct HTML fetch failed:', e.message);
  }
  return null;
}

// Extract info from URL as last resort
function extractFromUrl(url: string): { title: string; description: string; image: string; content: string } {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.length - 1];
    let title = '';
    if (slug) {
      title = slug.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
      title = title.charAt(0).toUpperCase() + title.slice(1);
    } else {
      title = urlObj.hostname;
    }
    return { title, description: '', image: '', content: '' };
  } catch {
    return { title: url, description: '', image: '', content: '' };
  }
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

    // Try multiple scraping strategies with fallback chain
    let scraped = await scrapeMicrolink(url);
    if (!scraped || !scraped.title) {
      console.log('Falling back to noembed...');
      scraped = await scrapeNoembed(url);
    }
    if (!scraped || !scraped.title) {
      console.log('Falling back to direct HTML fetch...');
      scraped = await scrapeDirectHtml(url);
    }
    if (!scraped || !scraped.title) {
      console.log('Using URL extraction fallback...');
      scraped = extractFromUrl(url);
    }

    const { title, description, image, content: pageContent } = scraped;

    // AI summarize + tag
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

    let summary = description || '';
    let tags = ['other'];

    try {
      const response = await callGemini(GEMINI_API_KEY, systemPrompt, `Content to analyze:\n${contentToAnalyze}`);

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
    } catch (e) {
      console.error('Gemini call failed:', e.message);
      // Still return what we scraped even if AI fails
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
