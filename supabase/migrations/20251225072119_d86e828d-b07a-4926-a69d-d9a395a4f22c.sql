-- Add tags column to bookmarks for categorization
ALTER TABLE public.bookmarks 
ADD COLUMN tags text[] DEFAULT '{}';

-- Add a content column to store extracted text for search
ALTER TABLE public.bookmarks 
ADD COLUMN content text;

-- Create index for faster tag searches
CREATE INDEX idx_bookmarks_tags ON public.bookmarks USING GIN(tags);