import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoMetadata {
  title: string;
  author: string;
  thumbnailUrl: string;
  duration: string;
  description?: string;
}

interface HighlightResult {
  highlights: Array<{
    timestamp: string;
    title: string;
    summary: string;
  }>;
  keyTopics: string[];
  summary: string;
}

async function fetchYouTubeMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    // Try noembed first (no API key needed)
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || 'Unknown Title',
        author: data.author_name || 'Unknown Author',
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '', // noembed doesn't provide duration
        description: '',
      };
    }
  } catch (e) {
    console.error('noembed fetch failed:', e);
  }
  return null;
}

async function generateHighlights(content: string, apiKey: string): Promise<HighlightResult> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a content analyst specializing in extracting key highlights from video/podcast content.
          
Given content metadata or description, generate:
1. Key highlights with estimated timestamps
2. Main topics covered
3. A concise summary

Respond ONLY with valid JSON in this exact format:
{
  "highlights": [
    {"timestamp": "0:00", "title": "Introduction", "summary": "Brief description"},
    {"timestamp": "2:30", "title": "Key Point 1", "summary": "Brief description"}
  ],
  "keyTopics": ["topic1", "topic2"],
  "summary": "Overall summary in 2-3 sentences"
}`
        },
        {
          role: "user",
          content: `Analyze this content and generate highlights:\n\n${content}`
        }
      ],
    }),
  });

  if (!response.ok) {
    console.error('AI gateway error:', response.status);
    return {
      highlights: [],
      keyTopics: [],
      summary: ''
    };
  }

  const data = await response.json();
  const assistantMessage = data.choices?.[0]?.message?.content || '';
  
  try {
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (parseError) {
    console.error('Parse error:', parseError);
  }

  return {
    highlights: [],
    keyTopics: [],
    summary: ''
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform, generateHighlightsFlag } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let result: any = {
      thumbnailUrl: null,
      duration: null,
      highlights: [],
      metadata: null,
    };

    if (platform === 'youtube') {
      // Extract video ID
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (videoId) {
        // Fetch metadata
        const metadata = await fetchYouTubeMetadata(videoId);
        if (metadata) {
          result.thumbnailUrl = metadata.thumbnailUrl;
          result.duration = metadata.duration;
          result.metadata = metadata;

          // Generate AI highlights if requested
          if (generateHighlightsFlag && metadata.title) {
            const contentToAnalyze = `Video Title: ${metadata.title}\nChannel: ${metadata.author}\n${metadata.description || ''}`;
            const highlights = await generateHighlights(contentToAnalyze, LOVABLE_API_KEY);
            result.highlights = highlights.highlights;
            result.summary = highlights.summary;
            result.keyTopics = highlights.keyTopics;
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Archive error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
