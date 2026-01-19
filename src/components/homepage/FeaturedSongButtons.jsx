import React from 'react';
import { motion } from 'framer-motion';
import { Play, Music2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function FeaturedSongButtons() {
  const { data: featuredSongs = [] } = useQuery({
    queryKey: ['featuredSongs'],
    queryFn: async () => {
      const songs = await base44.entities.FeaturedSong.filter({ is_active: true }, 'position');
      return songs;
    }
  });

  // Split songs by position (1-3 left, 4-6 right)
  const leftSongs = featuredSongs.filter(s => s.position >= 1 && s.position <= 3);
  const rightSongs = featuredSongs.filter(s => s.position >= 4 && s.position <= 6);

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const SongButton = ({ song, index, side }) => {
    const youtubeId = extractYoutubeId(song.youtube_link);
    const thumbnailUrl = song.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null);

    return (
      <motion.a
        href={song.youtube_link}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, x: side === 'left' ? -100 : 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group relative"
      >
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 hover:scale-110 cursor-pointer bg-gradient-to-br from-amber-600 to-amber-700">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={song.song_title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 className="w-8 h-8 text-white" />
            </div>
          )}
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        {/* Tooltip */}
        <div className={`absolute ${side === 'left' ? 'left-full ml-4' : 'right-full mr-4'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
          <div className="bg-stone-900 text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <p className="font-bold text-sm">{song.song_title}</p>
            {song.artist_name && (
              <p className="text-xs text-stone-300">{song.artist_name}</p>
            )}
          </div>
        </div>
      </motion.a>
    );
  };

  if (featuredSongs.length === 0) return null;

  return (
    <div className="fixed top-32 left-0 right-0 pointer-events-none z-30">
      {/* Left side buttons */}
      {leftSongs.length > 0 && (
        <div className="absolute left-4 top-0 flex flex-col gap-6 pointer-events-auto">
          {leftSongs.map((song, index) => (
            <SongButton key={song.id} song={song} index={index} side="left" />
          ))}
        </div>
      )}

      {/* Right side buttons */}
      {rightSongs.length > 0 && (
        <div className="absolute right-4 top-0 flex flex-col gap-6 pointer-events-auto">
          {rightSongs.map((song, index) => (
            <SongButton key={song.id} song={song} index={index} side="right" />
          ))}
        </div>
      )}
    </div>
  );
}