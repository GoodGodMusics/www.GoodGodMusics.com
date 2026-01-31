import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

export default function YouTubePlayer({ playlist, currentIndex, onIndexChange }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);

  const currentSong = playlist?.[currentIndex];

  // Extract video ID from YouTube URL
  const getVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Initialize YouTube API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API Ready');
    };
  }, []);

  // Create player when song changes
  useEffect(() => {
    if (!currentSong || !window.YT || !window.YT.Player) return;

    const videoId = getVideoId(currentSong.youtube_link);
    if (!videoId) return;

    // Destroy existing player
    if (player) {
      player.destroy();
    }

    // Create new player
    const newPlayer = new window.YT.Player(playerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        enablejsapi: 1,
        origin: window.location.origin,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          console.log('Player ready');
          setPlayer(event.target);
          setIsPlaying(true);
        },
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (event.data === window.YT.PlayerState.ENDED) {
            handleNext();
          }
        }
      }
    });

    return () => {
      if (newPlayer && newPlayer.destroy) {
        newPlayer.destroy();
      }
    };
  }, [currentSong?.youtube_link]);

  const handlePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const handleNext = () => {
    if (currentIndex < playlist.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const handleVolumeToggle = () => {
    if (!player) return;
    if (isMuted) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value) => {
    if (!player) return;
    const newVolume = value[0];
    setVolume(newVolume);
    player.setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    }
  };

  if (!currentSong) {
    return (
      <Card className="bg-stone-100 border-2 border-dashed border-stone-300">
        <div className="aspect-video flex items-center justify-center text-stone-500">
          <div className="text-center">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Select a song to play</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-stone-900" ref={containerRef}>
      {/* Video Player */}
      <div className="aspect-video bg-black relative">
        <div ref={playerRef} className="w-full h-full" />
      </div>

      {/* Controls */}
      <div className="bg-stone-800 p-4 space-y-3">
        {/* Song Info */}
        <div className="text-white">
          <div className="font-bold text-lg">{currentSong.song_title}</div>
          <div className="text-sm text-stone-400">
            {currentSong.song_artist} • {currentSong.book_chapter}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="text-white hover:bg-stone-700"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="text-white hover:bg-stone-700"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === playlist.length - 1}
              className="text-white hover:bg-stone-700"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVolumeToggle}
                className="text-white hover:bg-stone-700"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <div className="w-24">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="cursor-pointer"
                />
              </div>
            </div>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFullscreen}
              className="text-white hover:bg-stone-700"
            >
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Track Progress */}
        <div className="text-center text-xs text-stone-400">
          Track {currentIndex + 1} of {playlist.length}
        </div>
      </div>
    </Card>
  );
}