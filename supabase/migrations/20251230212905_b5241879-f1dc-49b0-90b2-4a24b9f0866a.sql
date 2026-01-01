-- Make videos bucket public so uploaded videos can be viewed
UPDATE storage.buckets SET public = true WHERE id = 'videos';