import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Shuffle, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STORAGE_KEY = 'youtube_player_state';

export default function YouTubePlayer({ playlist, currentIndex, onIndexChange, onShufflePlaylist }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(null);
  const [showFallback, setShowFallback] = useState(false);
  const progressIntervalRef = useRef(null);
  const playerInstanceRef = useRef(null);

  const currentSong = playlist?.[currentIndex];

  // Extract video ID from YouTube URL
  const getVideoId = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setVolume(state.volume || 100);
        setIsMuted(state.isMuted || false);
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    const state = { volume, isMuted, currentIndex, currentTime };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [volume, isMuted, currentIndex, currentTime]);

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
    if (!currentSong) return;

    const videoId = getVideoId(currentSong.youtube_link);
    if (!videoId) {
      setVideoError('Invalid YouTube URL');
      setShowFallback(true);
      return;
    }

    setVideoError(null);
    setShowFallback(false);

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }
      if (!document.getElementById('youtube-player')) {
        setTimeout(initPlayer, 100);
        return;
      }

      // Destroy existing player
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
        playerInstanceRef.current = null;
        setPlayer(null);
      }

      // Create new player
      try {
        const newPlayer = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            fs: 1,
            mute: 1
          },
          events: {
            onReady: (event) => {
              console.log('Player ready for:', currentSong.song_title);
              const playerInstance = event.target;
              playerInstanceRef.current = playerInstance;
              setPlayer(playerInstance);
              
              try {
                playerInstance.playVideo();
                setTimeout(() => {
                  playerInstance.unMute();
                  playerInstance.setVolume(volume);
                  setIsMuted(false);
                }, 500);
                setIsPlaying(true);
                const videoDuration = playerInstance.getDuration();
                if (videoDuration) setDuration(videoDuration);
              } catch (err) {
                console.error('Error starting playback:', err);
              }
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setDuration(event.target.getDuration());
                setShowFallback(false);
                // Start progress tracking
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = setInterval(() => {
                  if (event.target && event.target.getCurrentTime) {
                    setCurrentTime(event.target.getCurrentTime());
                  }
                }, 500);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
                handleNext();
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              let errorMsg = 'Video failed to load';
              
              // Error codes: 2 = invalid param, 5 = HTML5 error, 100 = not found, 101/150 = embedding disabled
              if (event.data === 100) {
                errorMsg = 'Video not found or has been removed';
              } else if (event.data === 101 || event.data === 150) {
                errorMsg = 'Video cannot be embedded (disabled by owner)';
              }
              
              setVideoError(errorMsg);
              setShowFallback(true);
              setIsPlaying(false);
            }
          }
        });
      } catch (e) {
        console.error('Error creating player:', e);
        setVideoError('Failed to initialize player');
        setShowFallback(true);
      }
    };

    initPlayer();

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch (e) {
          console.error('Cleanup error:', e);
        }
        playerInstanceRef.current = null;
      }
    };
  }, [currentSong?.youtube_link]);

  const handlePlayPause = () => {
    if (!player) {
      console.warn("YouTube player not ready");
      return;
    }
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
      if (player.isMuted && player.isMuted()) {
        player.unMute();
        setIsMuted(false);
      }
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
      if (player.getVolume) {
        setVolume(player.getVolume());
      }
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

  const handleSeek = (value) => {
    if (!player) return;
    const seekTime = value[0];
    player.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const handleOpenYouTube = () => {
    if (currentSong?.youtube_link) {
      window.open(currentSong.youtube_link, '_blank');
    }
  };

  const handleSearchManually = () => {
    const query = encodeURIComponent(`${currentSong.song_title} ${currentSong.song_artist}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
  };

  return (
    <Card className="overflow-hidden bg-stone-900" ref={containerRef}>
      {/* Video Player */}
      <div
        className="aspect-video bg-black relative"
        style={{
          position: 'relative',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
        }}
      >
        {showFallback ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-900 p-6">
            <div className="text-center max-w-md">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-400" />
              <h3 className="text-xl font-bold text-white mb-2">Video Unavailable</h3>
              <p className="text-stone-300 text-sm mb-6">{videoError || 'This video cannot be played'}</p>
              
              <div className="space-y-3">
                <Button
                  onClick={handleOpenYouTube}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open on YouTube
                </Button>
                <Button
                  onClick={handleSearchManually}
                  variant="outline"
                  className="w-full border-stone-600 text-stone-300 hover:bg-stone-700"
                >
                  Search for Song
                </Button>
                <Button
                  onClick={handleNext}
                  variant="ghost"
                  className="w-full text-stone-400 hover:text-white hover:bg-stone-700"
                  disabled={currentIndex === playlist.length - 1}
                >
                  Skip to Next Track
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div
            id="youtube-player"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            {/* YouTube iframe will be inserted here */}
          </div>
        )}
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

        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration || 100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-stone-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
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
            {onShufflePlaylist && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShufflePlaylist}
                className="text-white hover:bg-stone-700"
                title="Shuffle Playlist"
              >
                <Shuffle className="w-5 h-5" />
              </Button>
            )}
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