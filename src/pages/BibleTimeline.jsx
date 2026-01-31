import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, BookOpen, Music2, Loader2, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EraSection from '@/components/bible/EraSection';
import SuggestSongModal from '@/components/bible/SuggestSongModal';
import TagFilter from '@/components/tags/TagFilter';

export default function BibleTimeline() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const user = await base44.auth.me();
        setUserId(user.email);
      } catch {
        const sessionId = localStorage.getItem('sessionId') || Date.now().toString();
        localStorage.setItem('sessionId', sessionId);
        setUserId(sessionId);
      }
    };
    getUserId();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestament, setSelectedTestament] = useState('all');
  const [filterHasMusic, setFilterHasMusic] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const { data: chapters = [], isLoading } = useQuery({
    queryKey: ['bibleChapters'],
    queryFn: () => base44.entities.BibleChapter.list('chronological_order', 1500)
  });

  // Get all unique tags from chapters
  const allTags = useMemo(() => {
    const tags = [];
    chapters.forEach(chapter => {
      if (chapter.key_themes && Array.isArray(chapter.key_themes)) {
        tags.push(...chapter.key_themes);
      }
    });
    return tags;
  }, [chapters]);

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
      
      const matchesTags = selectedTags.length === 0 || 
        (chapter.key_themes && selectedTags.every(tag => chapter.key_themes.includes(tag)));
      
      return matchesSearch && matchesTestament && matchesMusic && matchesTags;
    });
  }, [chapters, searchQuery, selectedTestament, filterHasMusic, selectedTags]);

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

  // Biblical timeline with approximate dates
  const timelineData = [
    { era: 'Creation', period: 'Beginning', dateRange: 'Genesis 1-11', color: 'from-purple-500 to-purple-600' },
    { era: 'Patriarchs', period: '2000-1800 BC', dateRange: 'Abraham to Jacob', color: 'from-blue-500 to-blue-600' },
    { era: 'Egypt & Exodus', period: '1800-1446 BC', dateRange: 'Joseph to Moses', color: 'from-cyan-500 to-cyan-600' },
    { era: 'Wilderness', period: '1446-1406 BC', dateRange: '40 Years', color: 'from-teal-500 to-teal-600' },
    { era: 'Conquest', period: '1406-1375 BC', dateRange: 'Joshua', color: 'from-green-500 to-green-600' },
    { era: 'Judges', period: '1375-1050 BC', dateRange: 'Judges Era', color: 'from-lime-500 to-lime-600' },
    { era: 'United Kingdom', period: '1050-930 BC', dateRange: 'Saul, David, Solomon', color: 'from-yellow-500 to-yellow-600' },
    { era: 'Divided Kingdom', period: '930-586 BC', dateRange: 'Israel & Judah', color: 'from-orange-500 to-orange-600' },
    { era: 'Exile', period: '586-539 BC', dateRange: 'Babylonian Captivity', color: 'from-red-500 to-red-600' },
    { era: 'Return', period: '539-400 BC', dateRange: 'Ezra & Nehemiah', color: 'from-pink-500 to-pink-600' },
    { era: 'Intertestamental', period: '400 BC - 4 BC', dateRange: 'Between Testaments', color: 'from-rose-500 to-rose-600' },
    { era: 'Gospels', period: '4 BC - 30 AD', dateRange: 'Life of Christ', color: 'from-amber-500 to-amber-600' },
    { era: 'Early Church', period: '30-60 AD', dateRange: 'Acts', color: 'from-emerald-500 to-emerald-600' },
    { era: 'Epistles', period: '50-95 AD', dateRange: 'Paul & Letters', color: 'from-sky-500 to-sky-600' },
    { era: 'Apocalypse', period: '95 AD', dateRange: 'Revelation', color: 'from-violet-500 to-violet-600' }
  ];

  const eraOrder = timelineData.map(t => t.era);

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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      {/* Hero Header */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulance type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3">
              Biblical Timeline
            </h1>
            <p className="text-amber-200/80 text-base md:text-lg max-w-2xl mx-auto">
              Journey through 4,000 years of biblical history in chronological order
            </p>
          </motion.div>
        </div>
      </section>

      {/* Visual Timeline */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-serif font-bold text-stone-800 mb-6 text-center">Historical Timeline</h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-purple-200 via-amber-200 to-violet-200" />
            
            {/* Timeline Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {timelineData.map((item, index) => (
                <motion.div
                  key={item.era}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <div className={`bg-gradient-to-br ${item.color} rounded-2xl p-4 shadow-lg text-white relative z-10`}>
                    <div className="text-center">
                      <div className="font-bold text-sm mb-1">{item.era}</div>
                      <div className="text-xs opacity-90">{item.period}</div>
                      <div className="text-xs opacity-75 mt-1">{item.dateRange}</div>
                      {chaptersByEra[item.era] && (
                        <Badge className="mt-2 bg-white/20 text-white border-white/30">
                          {chaptersByEra[item.era].length} chapters
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Connection dot to timeline */}
                  <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br ${item.color} border-4 border-white z-20`} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-20 z-30 bg-white/95 backdrop-blur-lg shadow-md py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 rounded-full"
              />
            </div>

            {/* Testament filter */}
            <Tabs value={selectedTestament} onValueChange={setSelectedTestament}>
              <TabsList className="bg-stone-100 rounded-full">
                <TabsTrigger value="all" className="rounded-full">All</TabsTrigger>
                <TabsTrigger value="Old Testament" className="rounded-full">OT</TabsTrigger>
                <TabsTrigger value="New Testament" className="rounded-full">NT</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Music filter */}
            <Button
              variant={filterHasMusic ? 'default' : 'outline'}
              onClick={() => setFilterHasMusic(!filterHasMusic)}
              className={`rounded-full ${filterHasMusic ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
            >
              <Music2 className="w-4 h-4 mr-2" />
              Music
            </Button>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <TagFilter
              allTags={allTags}
              selectedTags={selectedTags}
              onTagToggle={(tag) => {
                setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                );
              }}
              onClearAll={() => setSelectedTags([])}
              placeholder="Filter by themes..."
            />
          )}
        </div>
      </section>

      {/* Chapter Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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