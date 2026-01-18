import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Search, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TheBook() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['allChapters'],
    queryFn: () => base44.entities.BibleChapter.list('chronological_order', 1500)
  });

  const filteredChapters = chapters.filter(chapter =>
    !searchQuery ||
    chapter.book?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${chapter.book} ${chapter.chapter_number}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group chapters by book
  const chaptersByBook = {};
  filteredChapters.forEach(chapter => {
    if (!chaptersByBook[chapter.book]) {
      chaptersByBook[chapter.book] = [];
    }
    chaptersByBook[chapter.book].push(chapter);
  });

  const books = Object.keys(chaptersByBook);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Ancient Book Background */}
      <div className="fixed inset-0 z-0">
        {/* Parchment texture base */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-50 to-stone-100" />
        
        {/* Paper texture overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' fill='%23D4A574'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply'
          }}
        />

        {/* Vignette edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-800/20 via-transparent to-stone-800/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-800/20 via-transparent to-stone-800/20" />
        
        {/* Book spine on left */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-stone-800 via-stone-700 to-transparent shadow-2xl">
          <div className="h-full w-2 bg-amber-900/50 ml-1" />
        </div>

        {/* Decorative corners */}
        <svg className="absolute top-0 left-16 w-32 h-32 text-amber-900/20" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L0,100 Z" fill="currentColor" />
        </svg>
        <svg className="absolute top-0 right-0 w-32 h-32 text-amber-900/20" viewBox="0 0 100 100">
          <path d="M0,0 L100,0 L100,100 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-0 left-16 w-32 h-32 text-amber-900/20" viewBox="0 0 100 100">
          <path d="M0,100 L100,100 L0,0 Z" fill="currentColor" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-32 h-32 text-amber-900/20" viewBox="0 0 100 100">
          <path d="M0,100 L100,0 L100,100 Z" fill="currentColor" />
        </svg>

        {/* Aged paper stains */}
        <div className="absolute top-20 right-1/4 w-40 h-40 rounded-full bg-amber-900/5 blur-3xl" />
        <div className="absolute bottom-32 left-1/3 w-56 h-56 rounded-full bg-stone-700/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <BookOpen className="w-20 h-20 text-amber-900/60" strokeWidth={1.5} />
              <div className="absolute -inset-2 bg-amber-200/20 rounded-full blur-xl -z-10" />
            </div>
          </div>
          
          <h1 
            className="text-6xl md:text-7xl lg:text-8xl mb-4 leading-tight"
            style={{
              fontFamily: 'Georgia, serif',
              color: '#5D3A1A',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '0.05em'
            }}
          >
            The Book
          </h1>
          
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-amber-800/50 to-transparent mx-auto mb-6" />
          
          <p className="text-stone-700 text-lg italic max-w-2xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
            "In the beginning was the Word, and the Word was with God, and the Word was God."
          </p>
          <p className="text-stone-600 text-sm mt-2">— John 1:1</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-800/50" />
            <Input
              placeholder="Search books or chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 bg-white/80 backdrop-blur-sm border-2 border-amber-900/20 rounded-xl shadow-lg focus:border-amber-700/50 text-stone-800"
              style={{ fontFamily: 'Georgia, serif' }}
            />
          </div>
        </motion.div>

        {/* Chapter Links - Condensed Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-amber-900/20 p-8 md:p-12"
          style={{
            boxShadow: '0 20px 60px rgba(93, 58, 26, 0.15), inset 0 1px 0 rgba(255,255,255,0.6)'
          }}
        >
          {isLoading ? (
            <div className="text-center py-12 text-amber-900/60">
              <BookOpen className="w-12 h-12 animate-pulse mx-auto mb-4" />
              <p style={{ fontFamily: 'Georgia, serif' }}>Opening The Book...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12 text-stone-600">
              <p style={{ fontFamily: 'Georgia, serif' }}>No chapters found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {books.map((bookName, bookIndex) => (
                <motion.div
                  key={bookName}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: bookIndex * 0.05 }}
                  className="border-b border-amber-900/10 pb-6 last:border-b-0"
                >
                  {/* Book Title */}
                  <h2 
                    className="text-2xl md:text-3xl font-bold text-amber-900 mb-4 flex items-center gap-3"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    <div className="w-2 h-8 bg-gradient-to-b from-amber-700 to-amber-900 rounded" />
                    {bookName}
                    <Badge variant="outline" className="ml-2 border-amber-700/30 text-amber-800 text-xs">
                      {chaptersByBook[bookName][0].testament}
                    </Badge>
                  </h2>

                  {/* Chapter Links - Compact Grid */}
                  <div className="flex flex-wrap gap-2">
                    {chaptersByBook[bookName].map((chapter, chapterIndex) => (
                      <motion.a
                        key={chapter.id}
                        href={chapter.youtube_link || '#'}
                        target={chapter.youtube_link ? '_blank' : '_self'}
                        rel={chapter.youtube_link ? 'noopener noreferrer' : ''}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (bookIndex * 0.05) + (chapterIndex * 0.01) }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          transition-all duration-300
                          ${chapter.youtube_link 
                            ? 'bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md hover:shadow-xl' 
                            : 'bg-stone-200/80 text-stone-500 cursor-default'
                          }
                        `}
                        style={{
                          fontFamily: 'Georgia, serif',
                          fontSize: '0.875rem',
                          boxShadow: chapter.youtube_link ? '0 2px 8px rgba(180, 83, 9, 0.2)' : 'none'
                        }}
                      >
                        <span className="font-semibold">{chapter.chapter_number}</span>
                        {chapter.youtube_link && (
                          <>
                            <Play className="w-3 h-3 fill-current opacity-80 group-hover:opacity-100" />
                            
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-stone-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                              {chapter.song_title ? (
                                <>
                                  <div className="font-bold">{chapter.song_title}</div>
                                  {chapter.song_artist && (
                                    <div className="text-stone-300">by {chapter.song_artist}</div>
                                  )}
                                </>
                              ) : (
                                <div>Click to play music</div>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                            </div>
                          </>
                        )}
                      </motion.a>
                    ))}
                  </div>

                  {/* Era badge */}
                  {chaptersByBook[bookName][0].era && (
                    <div className="mt-3">
                      <Badge 
                        variant="secondary" 
                        className="bg-amber-100/80 text-amber-900 border border-amber-900/20 text-xs"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        Era: {chaptersByBook[bookName][0].era}
                      </Badge>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/50 backdrop-blur-sm rounded-full border-2 border-amber-900/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                {chapters.length}
              </div>
              <div className="text-xs text-stone-600 uppercase tracking-wider">Chapters</div>
            </div>
            <div className="w-px h-8 bg-amber-900/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                {chapters.filter(c => c.youtube_link).length}
              </div>
              <div className="text-xs text-stone-600 uppercase tracking-wider">With Music</div>
            </div>
            <div className="w-px h-8 bg-amber-900/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>
                {books.length}
              </div>
              <div className="text-xs text-stone-600 uppercase tracking-wider">Books</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}