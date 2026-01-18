import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, X, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function ThemeSongPlayer({ songUrl, title, artist, autoplay = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const playerRef = useRef(null);
  const iframeRef = useRef(null);

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(songUrl);

  useEffect(() => {
    if (autoplay && !isClosed) {
      setIsPlaying(true);
    }
  }, [autoplay, isClosed]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (isClosed || !videoId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          height: isMinimized ? '60px' : 'auto'
        }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
      >
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl shadow-2xl border-2 border-amber-500/30 overflow-hidden backdrop-blur-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-black/20">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm truncate">
                  {title || 'Homepage Theme Song'}
                </div>
                {artist && (
                  <div className="text-amber-300/80 text-xs truncate">
                    {artist}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <span className="text-xs">{isMinimized ? '▼' : '▲'}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsClosed(true)}
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Player Content */}
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* YouTube Player */}
              <div className="relative aspect-video bg-black">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1`}
                  title={title || 'Theme Song'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Controls */}
              <div className="p-4 bg-black/30">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/10"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                  </Button>

                  <div className="flex items-center gap-2 flex-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/10 h-8 w-8"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={(val) => setVolume(val[0])}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                  </div>

                  <div className="text-xs text-amber-300/60 hidden sm:block">
                    🎵 Now Playing
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}