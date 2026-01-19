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

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const SongButton = ({ song, index }) => {
    const youtubeId = extractYoutubeId(song.youtube_link);
    const thumbnailUrl = song.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null);

    return (
      <motion.a
        href={song.youtube_link}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
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
        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
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
    <div className="fixed top-24 left-0 right-0 pointer-events-none z-30">
      {/* Top center buttons */}
      <div className="flex justify-center gap-4 pointer-events-auto">
        {featuredSongs.map((song, index) => (
          <SongButton key={song.id} song={song} index={index} side="center" />
        ))}
      </div>
    </div>
  );
}