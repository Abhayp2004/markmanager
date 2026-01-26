-- Add columns for multi-modal archiving
ALTER TABLE public.bookmarks 
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS highlights jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS transcript text,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Create index for faster filtering of archived bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_archived_at ON public.bookmarks(archived_at) WHERE archived_at IS NOT NULL;