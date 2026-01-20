import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
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
    const [isDragging, setIsDragging] = useState(false);
    const [wasDragged, setWasDragged] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const velocityRef = useRef({ x: 0, y: 0 });
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const youtubeId = extractYoutubeId(song.youtube_link);
    const thumbnailUrl = song.thumbnail_url || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null);

    const handleDragStart = (event, info) => {
      setIsDragging(true);
      setWasDragged(false);
      dragStartPos.current = { x: info.point.x, y: info.point.y };
    };

    const handleDrag = (event, info) => {
      velocityRef.current = info.velocity;
      const moved = Math.abs(info.point.x - dragStartPos.current.x) + Math.abs(info.point.y - dragStartPos.current.y);
      if (moved > 5) {
        setWasDragged(true);
      }
    };

    const handleDragEnd = (event, info) => {
      setIsDragging(false);
      
      // Apply throw physics
      const throwStrength = 0.3;
      const friction = 0.92;
      
      let vx = velocityRef.current.x * throwStrength;
      let vy = velocityRef.current.y * throwStrength;
      
      const animateThrow = () => {
        if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return;
        
        const currentX = x.get();
        const currentY = y.get();
        
        vx *= friction;
        vy *= friction;
        
        x.set(currentX + vx);
        y.set(currentY + vy);
        
        requestAnimationFrame(animateThrow);
      };
      
      if (Math.abs(vx) > 10 || Math.abs(vy) > 10) {
        animateThrow();
      }
    };

    const handleClick = (e) => {
      if (wasDragged) {
        e.preventDefault();
      }
    };

    return (
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, y }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
        className="group relative cursor-grab active:cursor-grabbing"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <a
          href={song.youtube_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block"
        >
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-2xl hover:shadow-amber-500/50 transition-all duration-300 bg-gradient-to-br from-amber-600 to-amber-700">
            {thumbnailUrl ? (
              <img 
                src={thumbnailUrl} 
                alt={song.song_title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                draggable="false"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2 className="w-8 h-8 text-white" />
              </div>
            )}
            
            {/* Play overlay */}
            {!isDragging && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            )}
          </div>
        </a>

        {/* Tooltip */}
        {!isDragging && (
          <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            <div className="bg-stone-900 text-white px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
              <p className="font-bold text-sm">{song.song_title}</p>
              {song.artist_name && (
                <p className="text-xs text-stone-300">{song.artist_name}</p>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  if (featuredSongs.length === 0) return null;

  return (
    <div className="fixed top-24 left-0 right-0 pointer-events-none z-50">
      <div className="flex justify-center gap-4 pointer-events-auto">
        {featuredSongs.map((song, index) => (
          <SongButton key={song.id} song={song} index={index} />
        ))}
      </div>
    </div>
  );
}