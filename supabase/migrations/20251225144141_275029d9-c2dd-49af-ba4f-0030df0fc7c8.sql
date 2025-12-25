-- Add priority column to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'pinned', 'reference'));