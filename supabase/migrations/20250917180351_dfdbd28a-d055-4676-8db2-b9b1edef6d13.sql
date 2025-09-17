-- Add cover_image_url to environments table for environment cover images
ALTER TABLE public.environments 
ADD COLUMN cover_image_url text;