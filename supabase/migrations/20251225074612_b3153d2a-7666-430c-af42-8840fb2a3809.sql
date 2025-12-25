-- Add notes column to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN notes text;