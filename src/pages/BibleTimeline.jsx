import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Filter, Music2, Loader2, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EraSection from '@/components/bible/EraSection';
import SuggestSongModal from '@/components/bible/SuggestSongModal';

export default function BibleTimeline() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState('all');
  const [filterHasMusic, setFilterHasMusic] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['bibleChapters'],
    queryFn: () => base44.entities.BibleChapter.list('chronological_order', 1500)
  });

  // Filter chapters
  const filteredChapters = useMemo(() => {
    return chapters.filter(chapter => {
      const matchesSearch = !searchQuery || 
        chapter.book?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.key_verse?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chapter.song_title?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTestament = selectedTestament === 'all' || 
        chapter.testament === selectedTestament;
      
      const matchesMusic = !filterHasMusic || chapter.youtube_link;
      
      return matchesSearch && matchesTestament && matchesMusic;
    });
  }, [chapters, searchQuery, selectedTestament, filterHasMusic]);

  // Group chapters by era
  const chaptersByEra = useMemo(() => {
    const grouped = {};
    filteredChapters.forEach(chapter => {
      const era = chapter.era || 'Unknown';
      if (!grouped[era]) {
        grouped[era] = [];
      }
      grouped[era].push(chapter);
    });
    return grouped;
  }, [filteredChapters]);

  const eraOrder = [
    'Creation',
    'Patriarchs',
    'Egypt & Exodus',
    'Wilderness',
    'Conquest',
    'Judges',
    'United Kingdom',
    'Divided Kingdom',
    'Exile',
    'Return',
    'Intertestamental',
    'Gospels',
    'Early Church',
    'Epistles',
    'Apocalypse'
  ];

  const sortedEras = Object.keys(chaptersByEra).sort((a, b) => {
    const indexA = eraOrder.indexOf(a);
    const indexB = eraOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const handleSuggestSong = (chapter) => {
    setSelectedChapter(chapter);
    setIsSuggestModalOpen(true);
  };

  const chaptersWithMusic = chapters.filter(c => c.youtube_link).length;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
              Bible Timeline
            </h1>
            <p className="text-amber-200/80 text-lg md:text-xl max-w-2xl mx-auto">
              Explore every chapter of the Bible in chronological order, 
              each paired with inspirational music to enhance your study.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-10">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{chapters.length}</p>
                <p className="text-amber-200/60 text-sm">Chapters</p>
              </div>
              <div className="w-px h-12 bg-stone-600" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{chaptersWithMusic}</p>
                <p className="text-amber-200/60 text-sm">With Music</p>
              </div>
              <div className="w-px h-12 bg-stone-600" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{sortedEras.length}</p>
                <p className="text-amber-200/60 text-sm">Eras</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-30 bg-white/90 backdrop-blur-lg border-b border-stone-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search chapters, verses, or songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-3 rounded-full border-stone-200 focus:border-amber-400 focus:ring-amber-400"
              />
            </div>

            {/* Testament filter */}
            <Tabs value={selectedTestament} onValueChange={setSelectedTestament}>
              <TabsList className="bg-stone-100 rounded-full p-1">
                <TabsTrigger value="all" className="rounded-full px-4">All</TabsTrigger>
                <TabsTrigger value="Old Testament" className="rounded-full px-4">Old Testament</TabsTrigger>
                <TabsTrigger value="New Testament" className="rounded-full px-4">New Testament</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Music filter */}
            <Button
              variant={filterHasMusic ? 'default' : 'outline'}
              onClick={() => setFilterHasMusic(!filterHasMusic)}
              className={`rounded-full ${filterHasMusic ? 'bg-amber-600 hover:bg-amber-700' : 'border-stone-200'}`}
            >
              <Music2 className="w-4 h-4 mr-2" />
              Has Music
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-amber-600 animate-spin mb-4" />
            <p className="text-stone-500">Loading chapters...</p>
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-stone-300" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-800 mb-2">No Chapters Found</h3>
            <p className="text-stone-500 mb-6">
              {chapters.length === 0 
                ? "Bible chapters haven't been added yet. Check back soon!" 
                : "Try adjusting your search or filters."}
            </p>
            {(searchQuery || filterHasMusic || selectedTestament !== 'all') && (
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterHasMusic(false);
                  setSelectedTestament('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedEras.map((era) => (
              <EraSection
                key={era}
                era={era}
                chapters={chaptersByEra[era]}
                onSuggestSong={handleSuggestSong}
              />
            ))}
          </div>
        )}
      </section>

      {/* Suggest Song Modal */}
      <SuggestSongModal
        chapter={selectedChapter}
        isOpen={isSuggestModalOpen}
        onClose={() => {
          setIsSuggestModalOpen(false);
          setSelectedChapter(null);
        }}
      />
    </div>
  );
}