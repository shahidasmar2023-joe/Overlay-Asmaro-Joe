import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Shield, Volume2, VolumeX, Sparkles, Maximize2, RotateCcw } from 'lucide-react';
import { StoreSettings } from '../types';
import { parseVideoUrl } from '../utils/videoHelper';

interface VideoWithWatermarkProps {
  videoUrl?: string;
  thumbnailUrl: string;
  title: string;
  settings: StoreSettings;
  className?: string;
  autoPlayOnHover?: boolean;
  audioAlertUrl?: string;
  showControls?: boolean;
  priority?: boolean;
  disableWatermark?: boolean;
}

export const VideoWithWatermark: React.FC<VideoWithWatermarkProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  settings,
  className = '',
  autoPlayOnHover = true,
  audioAlertUrl,
  showControls = true,
  disableWatermark = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlayingAudioAlert, setIsPlayingAudioAlert] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const parsed = parseVideoUrl(videoUrl);

  // Reset video error when videoUrl changes
  useEffect(() => {
    setVideoError(false);
  }, [videoUrl]);

  // Smooth hover play handling for direct video files
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (!autoPlayOnHover || parsed.type !== 'direct' || !videoRef.current || videoError) return;

    try {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromiseRef.current = playPromise;
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.debug('Autoplay hindered', err);
            }
          });
      }
    } catch {
      // Ignored for smooth UX
    }
  }, [autoPlayOnHover, parsed.type, videoError]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (!autoPlayOnHover || parsed.type !== 'direct' || !videoRef.current) return;

    const video = videoRef.current;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          video.pause();
          video.currentTime = 0;
          setIsPlaying(false);
        })
        .catch(() => {
          video.pause();
          setIsPlaying(false);
        });
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [autoPlayOnHover, parsed.type]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current || parsed.type !== 'direct') return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const toggleAudioAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioAlertUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioAlertUrl);
      audioRef.current.onended = () => setIsPlayingAudioAlert(false);
    }

    if (isPlayingAudioAlert) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudioAlert(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingAudioAlert(true)).catch(() => {});
    }
  };

  const watermarkOpacity = typeof settings.watermarkOpacity === 'number' ? settings.watermarkOpacity : 0.65;

  return (
    <div
      className={`relative overflow-hidden group rounded-2xl bg-slate-950 border border-white/10 select-none transform-gpu ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      draggable={false}
      style={{ willChange: 'transform', userSelect: 'none' }}
    >
      {/* 1. Direct HTML5 Video Player */}
      {parsed.type === 'direct' && !videoError && (
        <video
          ref={videoRef}
          src={parsed.url}
          poster={thumbnailUrl}
          autoPlay={autoPlayOnHover}
          loop
          muted={isMuted}
          playsInline
          preload="auto"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onError={() => setVideoError(true)}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 transform-gpu pointer-events-auto"
        />
      )}

      {/* 2. Embedded YouTube / Iframe Video Player */}
      {(parsed.type === 'youtube' || parsed.type === 'iframe') && parsed.embedUrl && !videoError && (
        <div className="w-full h-full relative pointer-events-auto">
          <iframe
            src={parsed.embedUrl}
            title={title}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {/* 3. Poster Image (if no video or if video errored) */}
      {(parsed.type === 'none' || videoError) && (
        <img
          src={thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'}
          alt={title}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 transform-gpu"
          loading="lazy"
        />
      )}

      {/* --- FULL-SCREEN WATERMARK OVERLAY IMAGE (STRETCHED OVER FULL VIDEO ACROSS ENTIRE DURATION TO PREVENT THEFT) --- */}
      {!disableWatermark && settings.watermarkLogoUrl && watermarkOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
          style={{ opacity: watermarkOpacity }}
        >
          <img
            src={settings.watermarkLogoUrl}
            alt="Watermark Overlay"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            className="w-full h-full object-cover select-none mix-blend-screen"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Transparent anti-drag invisible guard plate */}
      <div 
        className="absolute inset-0 z-15 select-none" 
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        style={{ pointerEvents: 'none' }}
      />

      {/* High-Contrast Gradient Backdrop Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/25 pointer-events-none transition-opacity duration-300" />

      {/* Interactive Controls Overlay for Direct HTML5 Video */}
      {showControls && parsed.type === 'direct' && !videoError && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-black/80 hover:bg-rose-600 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الفيديو'}
              aria-label="Toggle Play"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-xl bg-black/80 hover:bg-slate-800 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              aria-label="Toggle Audio Mute"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-black/80 hover:bg-slate-800 text-white backdrop-blur-md border border-white/20 transition-all shadow-lg active:scale-95"
              title="تكبير الشاشة (ملء الشاشة)"
              aria-label="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>

          {audioAlertUrl && (
            <button
              onClick={toggleAudioAlert}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md border transition-all shadow-lg active:scale-95 ${
                isPlayingAudioAlert
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-black/80 hover:bg-rose-950/80 text-rose-300 border-rose-500/30'
              }`}
              title="تجربة صوت التنبيه RTS"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudioAlert ? 'صوت RTS شغال...' : 'تنبيه RTS'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
