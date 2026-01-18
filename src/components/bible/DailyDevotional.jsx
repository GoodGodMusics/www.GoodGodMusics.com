import React from 'react';
import { motion } from 'framer-motion';
import { Sun, BookOpen, Music2, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function DailyDevotional() {
  const today = new Date().toISOString().split('T')[0];

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['dailyDevotional', today],
    queryFn: async () => {
      const devotionals = await base44.entities.DailyDevotional.filter({ devotional_date: today });
      if (devotionals.length > 0) return devotionals[0];
      
      // If no devotional for today, pick a random chapter with music
      const chapters = await base44.entities.BibleChapter.list('chronological_order', 1500);
      const chaptersWithMusic = chapters.filter(c => c.youtube_link);
      const randomChapter = chaptersWithMusic[Math.floor(Math.random() * chaptersWithMusic.length)];
      
      return {
        devotional_date: today,
        chapter_reference: `${randomChapter.book} ${randomChapter.chapter_number}`,
        devotional_title: `Today's Reading: ${randomChapter.book} ${randomChapter.chapter_number}`,
        devotional_text: randomChapter.summary || randomChapter.key_verse || 'Explore this chapter and discover God\'s message for you today.',
        reflection_prompt: 'How does this chapter speak to your current season of life?',
        prayer_focus: 'Thank God for His Word and ask for wisdom to apply it.',
        song_title: randomChapter.song_title,
        song_artist: randomChapter.song_artist,
        youtube_link: randomChapter.youtube_link,
        chapter_id: randomChapter.id,
        era: randomChapter.era
      };
    }
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 animate-pulse">
        <div className="h-48 bg-stone-200 rounded-2xl" />
      </div>
    );
  }

  if (!devotional) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 rounded-3xl shadow-xl border-2 border-amber-200 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">Daily Devotional</h2>
            <p className="text-white/80 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-amber-700" />
            <h3 className="text-2xl font-serif font-bold text-stone-800">
              {devotional.chapter_reference}
            </h3>
            {devotional.era && (
              <Badge className="bg-amber-600 text-white">{devotional.era}</Badge>
            )}
          </div>
          <h4 className="text-xl text-stone-700 mb-4">{devotional.devotional_title}</h4>
          <p className="text-stone-600 leading-relaxed text-lg">
            {devotional.devotional_text}
          </p>
        </div>

        {devotional.reflection_prompt && (
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-stone-800">Reflection Prompt</h4>
            </div>
            <p className="text-stone-600 italic">{devotional.reflection_prompt}</p>
          </div>
        )}

        {devotional.prayer_focus && (
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-stone-800">Prayer Focus</h4>
            </div>
            <p className="text-stone-600">{devotional.prayer_focus}</p>
          </div>
        )}

        {devotional.song_title && (
          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-100">
            <div className="flex items-center gap-2 mb-3">
              <Music2 className="w-5 h-5 text-red-600" />
              <h4 className="font-bold text-stone-800">Today's Worship Song</h4>
            </div>
            <p className="text-stone-800 font-medium mb-1">{devotional.song_title}</p>
            <p className="text-stone-600 text-sm mb-4">{devotional.song_artist}</p>
            {devotional.youtube_link && (
              <a href={devotional.youtube_link} target="_blank" rel="noopener noreferrer">
                <Button className="bg-red-600 hover:bg-red-700 w-full">
                  <Music2 className="w-4 h-4 mr-2" />
                  Listen Now
                </Button>
              </a>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Link to={createPageUrl('BibleTimeline')} className="flex-1">
            <Button variant="outline" className="w-full border-amber-300 text-amber-800 hover:bg-amber-50">
              <BookOpen className="w-4 h-4 mr-2" />
              Read Full Chapter
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}