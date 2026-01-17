import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Music2, ExternalLink, BookOpen, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ChapterCard({ chapter, onSuggestSong }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeVideoId(chapter.youtube_link);

  return (
    <motion.div
      className="group relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layout
    >
      <motion.div
        className={`
          relative bg-gradient-to-br from-amber-50/80 to-stone-50/80 
          backdrop-blur-sm border border-amber-200/50 
          rounded-2xl overflow-hidden
          transition-all duration-500
          ${isExpanded ? 'shadow-2xl shadow-amber-900/10' : 'shadow-lg shadow-amber-900/5'}
        `}
        whileHover={{ y: -4 }}
      >
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-200/30 to-transparent transform rotate-45 translate-x-8 -translate-y-8" />
        </div>

        {/* Main content */}
        <div 
          className="p-6 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Chapter reference */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-stone-800">
                    {chapter.book} {chapter.chapter_number}
                  </h3>
                  <p className="text-xs text-amber-700/70 uppercase tracking-wider">
                    {chapter.era}
                  </p>
                </div>
              </div>

              {/* Key verse */}
              {chapter.key_verse && (
                <p className="text-stone-600 text-sm italic mt-3 leading-relaxed line-clamp-2">
                  "{chapter.key_verse}"
                </p>
              )}

              {/* Song info */}
              {chapter.song_title && (
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                    <Music2 className="w-3 h-3 mr-1" />
                    {chapter.song_title}
                  </Badge>
                  {chapter.song_artist && (
                    <span className="text-xs text-stone-500">by {chapter.song_artist}</span>
                  )}
                </div>
              )}
            </div>

            {/* Play button */}
            {chapter.youtube_link && (
              <motion.a
                href={chapter.youtube_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-xl group-hover:shadow-red-500/40 transition-shadow">
                  <Play className="w-6 h-6 text-white fill-white ml-1" />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400/50"
                    animate={isHovered ? { scale: [1, 1.2, 1], opacity: [1, 0, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
              </motion.a>
            )}
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 border-t border-amber-200/50 pt-4">
                {/* Summary */}
                {chapter.summary && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-stone-700 mb-2">Chapter Summary</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">
                      {chapter.summary}
                    </p>
                  </div>
                )}

                {/* YouTube embed preview */}
                {videoId && (
                  <div className="mb-4 rounded-xl overflow-hidden shadow-inner">
                    <div className="aspect-video bg-stone-900">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={chapter.song_title || 'Music video'}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {chapter.youtube_link && (
                    <a
                      href={chapter.youtube_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Watch on YouTube
                      </Button>
                    </a>
                  )}
                  <Button 
                    variant="outline" 
                    className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSuggestSong?.(chapter);
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Suggest Song
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}