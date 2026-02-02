import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Repeat, Shuffle, Download, Settings, Music
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function EnhancedAudioPlayer({ 
  playlist = [], 
  currentTrackIndex = 0,
  onTrackChange,
  autoPlay = false 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [equalizer, setEqualizer] = useState({
    bass: 0,
    mid: 0,
    treble: 0
  });

  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const bassRef = useRef(null);
  const midRef = useRef(null);
  const trebleRef = useRef(null);

  const currentTrack = playlist[currentTrackIndex] || {};

  // Initialize Web Audio API for equalizer
  useEffect(() => {
    if (!audioRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const gainNode = audioContext.createGain();

    // Create filter nodes
    const bass = audioContext.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 200;

    const mid = audioContext.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 1;

    const treble = audioContext.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 3000;

    source.connect(bass).connect(mid).connect(treble).connect(gainNode).connect(audioContext.destination);

    audioContextRef.current = audioContext;
    gainNodeRef.current = gainNode;
    bassRef.current = bass;
    midRef.current = mid;
    trebleRef.current = treble;

    return () => {
      audioContext.close();
    };
  }, []);

  // Apply equalizer settings
  useEffect(() => {
    if (bassRef.current) bassRef.current.gain.value = equalizer.bass;
    if (midRef.current) midRef.current.gain.value = equalizer.mid;
    if (trebleRef.current) trebleRef.current.gain.value = equalizer.treble;
  }, [equalizer]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleNext = () => {
    const nextIndex = shuffle 
      ? Math.floor(Math.random() * playlist.length)
      : (currentTrackIndex + 1) % playlist.length;
    onTrackChange?.(nextIndex);
  };

  const handlePrevious = () => {
    const prevIndex = shuffle
      ? Math.floor(Math.random() * playlist.length)
      : currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    onTrackChange?.(prevIndex);
  };

  const handleEnded = () => {
    if (repeat) {
      audioRef.current?.play();
    } else {
      handleNext();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack.youtube_link && !currentTrack.audio_url) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-stone-500">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No audio source available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-stone-900 to-stone-800 text-white">
      <CardContent className="p-6">
        {/* Track Info */}
        <div className="flex items-center gap-4 mb-6">
          {currentTrack.cover_image_url && (
            <img 
              src={currentTrack.cover_image_url} 
              alt={currentTrack.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{currentTrack.song_title || currentTrack.title}</h3>
            <p className="text-stone-400 text-sm truncate">{currentTrack.song_artist || currentTrack.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="text-white"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-stone-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShuffle(!shuffle)}
            className={`text-white ${shuffle ? 'text-amber-500' : ''}`}
          >
            <Shuffle className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            className="text-white"
          >
            <SkipBack className="w-5 h-5" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlay}
            className="w-14 h-14 bg-amber-600 hover:bg-amber-700 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="text-white"
          >
            <SkipForward className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRepeat(!repeat)}
            className={`text-white ${repeat ? 'text-amber-500' : ''}`}
          >
            <Repeat className="w-5 h-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mt-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          autoPlay={autoPlay}
        />

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Playback Settings</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Playback Speed */}
              <div>
                <label className="text-sm font-medium mb-2 block">Playback Speed</label>
                <div className="flex gap-2">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <Button
                      key={rate}
                      variant={playbackRate === rate ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setPlaybackRate(rate);
                        if (audioRef.current) audioRef.current.playbackRate = rate;
                      }}
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
              </div>

              {/* Equalizer */}
              <div className="space-y-4">
                <label className="text-sm font-medium">Equalizer</label>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Bass</span>
                    <span>{equalizer.bass.toFixed(1)} dB</span>
                  </div>
                  <Slider
                    value={[equalizer.bass]}
                    min={-12}
                    max={12}
                    step={1}
                    onValueChange={(value) => setEqualizer({...equalizer, bass: value[0]})}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Mid</span>
                    <span>{equalizer.mid.toFixed(1)} dB</span>
                  </div>
                  <Slider
                    value={[equalizer.mid]}
                    min={-12}
                    max={12}
                    step={1}
                    onValueChange={(value) => setEqualizer({...equalizer, mid: value[0]})}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Treble</span>
                    <span>{equalizer.treble.toFixed(1)} dB</span>
                  </div>
                  <Slider
                    value={[equalizer.treble]}
                    min={-12}
                    max={12}
                    step={1}
                    onValueChange={(value) => setEqualizer({...equalizer, treble: value[0]})}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEqualizer({ bass: 0, mid: 0, treble: 0 })}
                  className="w-full"
                >
                  Reset Equalizer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}