-- Add platform column to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN platform text NOT NULL DEFAULT 'twitter';

-- Add index for platform filtering
CREATE INDEX idx_bookmarks_platform ON public.bookmarks(platform);

-- Update existing bookmarks to have 'twitter' platform (already default, but explicit)
UPDATE public.bookmarks SET platform = 'twitter' WHERE platform IS NULL OR platform = '';