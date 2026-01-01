import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface VideoPlayerProps {
  youtubeUrl?: string | null;
  videoFileUrl?: string | null;
  title: string;
  onComplete?: () => void;
}

export function VideoPlayer({ youtubeUrl, videoFileUrl, title, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
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
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={videoFileUrl}
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
