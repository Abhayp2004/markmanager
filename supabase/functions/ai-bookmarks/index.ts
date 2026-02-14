import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AVAILABLE_TAGS = [
  'tech', 'ai', 'crypto', 'sports', 'funny', 'news', 'politics', 
  'science', 'business', 'lifestyle', 'entertainment', 'education',
  'health', 'art', 'music', 'gaming', 'travel', 'food', 'motivation', 
  'spiritual', 'other'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, content, query, bookmarks, tweetUrl, platform: reqPlatform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (action === 'analyze') {
      // Analyze tweet content and generate tags
      let textToAnalyze = content;
      
      // If content is generic "Medium Article", extract from URL slug
      if ((!textToAnalyze || textToAnalyze === 'Medium Article') && tweetUrl && tweetUrl.includes('medium.com')) {
        try {
          const urlObj = new URL(tweetUrl);
          const pathParts = urlObj.pathname.split('/').filter(Boolean);
          const slug = pathParts[pathParts.length - 1];
          if (slug) {
            const cleanSlug = slug.replace(/-[a-f0-9]{10,}$/, '');
            const extractedTitle = cleanSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            textToAnalyze = `Medium article: "${extractedTitle}"`;
            console.log('Extracted Medium title for analysis:', extractedTitle);
          }
        } catch (e) {
          console.log('URL parsing failed for Medium analyze:', e);
        }
      }
      
      // If no content, try to fetch from oEmbed
      if (!textToAnalyze && tweetUrl) {
        console.log('No content provided, fetching oEmbed for:', tweetUrl);
        try {
          const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
          const oembedResponse = await fetch(oembedUrl);
          if (oembedResponse.ok) {
            const oembedData = await oembedResponse.json();
            textToAnalyze = oembedData.html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            console.log('Extracted text from oEmbed:', textToAnalyze?.substring(0, 100));
          }
        } catch (e) {
          console.log('oEmbed fetch failed:', e);
        }
      }

      // If still no content, analyze the URL itself
      if (!textToAnalyze && tweetUrl) {
        textToAnalyze = `Tweet from URL: ${tweetUrl}`;
      }

      console.log('Analyzing content for tags:', textToAnalyze?.substring(0, 100));
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a tweet categorization assistant. Analyze the tweet content and assign 1-3 relevant tags from this list: ${AVAILABLE_TAGS.join(', ')}.
              
              Even if content is limited, make your best guess based on any available information like usernames, keywords, or context.
              
              Respond ONLY with a JSON object in this exact format:
              {"tags": ["tag1", "tag2"], "summary": "brief one-sentence summary of the tweet"}`
            },
            {
              role: "user",
              content: `Analyze this tweet and categorize it:\n\n${textToAnalyze || 'Unknown tweet content'}`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ tags: ['other'], summary: '' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || '';
      console.log('AI response:', assistantMessage);

      try {
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const validTags = (parsed.tags || []).filter((t: string) => 
            AVAILABLE_TAGS.includes(t.toLowerCase())
          ).map((t: string) => t.toLowerCase());
          
          return new Response(JSON.stringify({ 
            tags: validTags.length > 0 ? validTags : ['other'],
            summary: parsed.summary || ''
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
      }

      return new Response(JSON.stringify({ tags: ['other'], summary: '' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === 'summarize') {
      let textToSummarize = content;
      const platform = reqPlatform || 'twitter';
      
      // For Medium, always try to fetch real content even if we have generic placeholder
      const needsFetch = !textToSummarize || textToSummarize === 'Medium Article' || textToSummarize === 'LinkedIn Post' || textToSummarize === 'Reddit Post';
      if (needsFetch && tweetUrl) {
        try {
          if (platform === 'twitter') {
            const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;
            const oembedResponse = await fetch(oembedUrl);
            if (oembedResponse.ok) {
              const oembedData = await oembedResponse.json();
              textToSummarize = oembedData.html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          } else if (platform === 'medium') {
            // Extract title from URL slug for Medium (page fetch often blocked)
            try {
              const urlObj = new URL(tweetUrl);
              const pathParts = urlObj.pathname.split('/').filter(Boolean);
              const authorPart = pathParts.find((p: string) => p.startsWith('@'));
              const slug = pathParts[pathParts.length - 1];
              let extractedTitle = '';
              if (slug) {
                const cleanSlug = slug.replace(/-[a-f0-9]{10,}$/, '');
                extractedTitle = cleanSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              }
              const author = authorPart ? authorPart.replace('@', '') : '';
              textToSummarize = `Medium article titled "${extractedTitle}"${author ? ` by ${author}` : ''}. URL: ${tweetUrl}. Please provide a detailed summary based on the article title and any context you can infer.`;
              console.log('Medium content from URL slug:', textToSummarize);
            } catch (e) {
              console.log('URL parsing failed for Medium:', e);
            }
          } else {
            // For LinkedIn, Reddit, etc. - use noembed
            try {
              const noembedResponse = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(tweetUrl)}`);
              if (noembedResponse.ok) {
                const noembedData = await noembedResponse.json();
                if (noembedData.title) {
                  textToSummarize = `${platform} content: ${noembedData.title}${noembedData.author_name ? ` by ${noembedData.author_name}` : ''}`;
                }
              }
            } catch (e) {
              console.log('noembed fetch failed:', e);
            }
          }
        } catch (e) {
          console.log('Fetch failed:', e);
        }
      }

      if (!textToSummarize) {
        textToSummarize = `Content from ${tweetUrl}`;
      }

      const platformLabels: Record<string, string> = {
        youtube: 'YouTube video',
        linkedin: 'LinkedIn post',
        reddit: 'Reddit post',
        medium: 'Medium article',
        twitter: 'tweet',
      };
      const platformLabel = platformLabels[platform] || 'content';

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a detailed content summarizer. Given a ${platformLabel}, provide a thorough and well-structured summary in 4-6 sentences. 

Your summary should:
- Start with the main topic or thesis
- Cover all key points, arguments, or insights mentioned
- Include any notable data, statistics, or examples referenced
- End with the conclusion or call-to-action if applicable
- Use clear, professional language

If the content is limited, infer what you can from context clues like the URL, author, or keywords.

Respond ONLY with a JSON object: {"summary": "your detailed summary here"}`
            },
            {
              role: "user",
              content: `Summarize this ${platformLabel}:\n\n${textToSummarize}`
            }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI gateway error:', response.status, errorText);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ summary: '' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || '';
      console.log('Summary response:', assistantMessage);

      try {
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ summary: parsed.summary || '' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
      }

      return new Response(JSON.stringify({ summary: assistantMessage.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === 'semantic-search') {
      console.log('Performing semantic search for:', query);
      
      if (!bookmarks || bookmarks.length === 0) {
        return new Response(JSON.stringify({ results: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bookmarkContext = bookmarks.map((b: any, i: number) => 
        `[${i}] Author: ${b.author_name || 'Unknown'}, URL: ${b.tweet_url}, Tags: ${(b.tags || []).join(', ')}, Content: ${b.content || 'No content'}`
      ).join('\n\n');

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a semantic search assistant. Given a search query and a list of bookmarks, return the indices of bookmarks that are semantically relevant to the query. Consider meaning, topics, and intent - not just keyword matching.
              
              Respond ONLY with a JSON array of indices, e.g., [0, 2, 5]. Return an empty array if no relevant results found.`
            },
            {
              role: "user",
              content: `Search query: "${query}"\n\nBookmarks:\n${bookmarkContext}`
            }
          ],
        }),
      });

      if (!response.ok) {
        console.error('Semantic search error:', response.status);
        return new Response(JSON.stringify({ results: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || '';
      console.log('Search response:', assistantMessage);

      try {
        const jsonMatch = assistantMessage.match(/\[[\d,\s]*\]/);
        if (jsonMatch) {
          const indices = JSON.parse(jsonMatch[0]);
          const results = indices
            .filter((i: number) => i >= 0 && i < bookmarks.length)
            .map((i: number) => bookmarks[i].id);
          
          return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
      }

      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === 'fetch-meta') {
      // Fetch og:image and og:title from a URL (for Medium etc. that block client CORS)
      if (!tweetUrl) {
        return new Response(JSON.stringify({ error: 'URL required' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let ogImage = '';
      let ogTitle = '';
      let ogDescription = '';
      
      // Use microlink.io API to extract meta (works where direct fetch is blocked)
      try {
        const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(tweetUrl)}`;
        const response = await fetch(microlinkUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            ogTitle = data.data.title || '';
            ogDescription = data.data.description || '';
            ogImage = data.data.image?.url || '';
            console.log('Microlink meta - title:', ogTitle?.substring(0, 50), 'image:', ogImage?.substring(0, 80));
          }
        } else {
          console.log('Microlink failed with status:', response.status);
          await response.text();
        }
      } catch (e) {
        console.log('Microlink fetch failed:', e);
      }

      return new Response(JSON.stringify({ image: ogImage, title: ogTitle, description: ogDescription }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === 'fetch-reddit') {
      // Fetch Reddit post metadata using Reddit's JSON API (server-side to bypass CORS)
      if (!tweetUrl) {
        return new Response(JSON.stringify({ error: 'URL required' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let title = '';
      let author = '';
      let thumbnail = '';
      let subreddit = '';

      try {
        // Clean up the URL - remove query params and add .json
        const urlObj = new URL(tweetUrl);
        const cleanPath = urlObj.pathname.replace(/\/$/, '');
        const jsonUrl = `https://www.reddit.com${cleanPath}.json`;
        console.log('Fetching Reddit JSON:', jsonUrl);

        const response = await fetch(jsonUrl, {
          headers: {
            'User-Agent': 'MarkManager/1.0 (bookmark saver)',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Reddit returns an array: [post listing, comments listing]
          const postData = data?.[0]?.data?.children?.[0]?.data;
          if (postData) {
            title = postData.title || '';
            author = postData.author || '';
            subreddit = postData.subreddit_name_prefixed || '';
            // Reddit thumbnails: skip 'self', 'default', 'nsfw', 'spoiler'
            const thumb = postData.thumbnail || '';
            if (thumb && thumb.startsWith('http')) {
              thumbnail = thumb;
            }
            // Try preview images for higher quality
            const previewImage = postData.preview?.images?.[0]?.source?.url;
            if (previewImage) {
              thumbnail = previewImage.replace(/&amp;/g, '&');
            }
            console.log('Reddit post - title:', title?.substring(0, 50), 'author:', author, 'subreddit:', subreddit);
          }
        } else {
          console.log('Reddit JSON API failed with status:', response.status);
          await response.text();
        }
      } catch (e) {
        console.log('Reddit fetch failed:', e);
      }

      return new Response(JSON.stringify({ title, author, thumbnail, subreddit }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});