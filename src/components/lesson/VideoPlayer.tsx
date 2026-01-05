import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface VideoPlayerProps {
  youtubeUrl?: string | null;
  videoFileUrl?: string | null;
  title: string;
  onComplete?: () => void;
  lessonId?: string;
}

/**
 * VideoPlayer component that handles YouTube embeds and private video files
 * 
 * SECURITY: For uploaded videos (videoFileUrl), this component fetches signed URLs
 * from the server to prevent unauthorized access. The videos bucket is private
 * and requires enrollment validation.
 */
export function VideoPlayer({ youtubeUrl, videoFileUrl, title, onComplete, lessonId }: VideoPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Fetch signed URL for private videos
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!videoFileUrl || !lessonId) return;
      
      // Extract the video path from the full URL
      // Video URLs are stored as full URLs, we need to extract the path
      const videoPath = extractVideoPath(videoFileUrl);
      if (!videoPath) {
        setUrlError('URL de vídeo inválida');
        return;
      }

      setIsLoadingUrl(true);
      setUrlError(null);

      try {
        const { data, error } = await supabase.functions.invoke('get-signed-video-url', {
          body: { lessonId, videoPath },
        });

        if (error) {
          console.error('Error fetching signed URL:', error);
          setUrlError('Erro ao carregar vídeo');
          return;
        }

        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        } else if (data?.error) {
          setUrlError(data.error);
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setUrlError('Erro ao carregar vídeo');
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [videoFileUrl, lessonId]);

  // Extract video path from full URL or path
  const extractVideoPath = (url: string): string | null => {
    try {
      // If it's already a path (not a full URL), return as is
      if (!url.startsWith('http')) {
        return url;
      }
      
      // Parse the URL and extract the path after /videos/
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/videos\/(.+)/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      
      // Try another pattern: /object/videos/...
      const altMatch = urlObj.pathname.match(/\/object\/videos\/(.+)/);
      if (altMatch) {
        return decodeURIComponent(altMatch[1]);
      }

      // If URL contains videos bucket reference
      if (url.includes('/videos/')) {
        const parts = url.split('/videos/');
        if (parts[1]) {
          return decodeURIComponent(parts[1].split('?')[0]);
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  if (youtubeUrl) {
    const videoId = getYouTubeId(youtubeUrl);
    if (videoId) {
      return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (videoFileUrl) {
    // Show loading state while fetching signed URL
    if (isLoadingUrl) {
      return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
      );
    }

    // Show error state
    if (urlError) {
      return (
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{urlError}</p>
          </div>
        </div>
      );
    }

    // Use signed URL if available, otherwise fall back to original URL
    // (fallback for backwards compatibility during transition)
    const videoSrc = signedUrl || videoFileUrl;

    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={videoSrc}
          className="w-full h-full"
          controls
          onEnded={onComplete}
        >
          Seu navegador não suporta a reprodução de vídeos.
        </video>
      </div>
    );
  }

  // Placeholder when no video
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nenhum vídeo disponível para esta aula</p>
      </div>
    </div>
  );
}
