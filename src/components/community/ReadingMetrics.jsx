import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Users, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ReadingMetrics() {
  const { data: views = [] } = useQuery({
    queryKey: ['chapterViews'],
    queryFn: () => base44.entities.ChapterView.list('-created_date', 1000)
  });

  // Calculate most viewed chapters
  const chapterStats = {};
  views.forEach(view => {
    if (!chapterStats[view.book_chapter]) {
      chapterStats[view.book_chapter] = {
        book_chapter: view.book_chapter,
        views: 0,
        uniqueUsers: new Set()
      };
    }
    chapterStats[view.book_chapter].views++;
    if (view.user_email) {
      chapterStats[view.book_chapter].uniqueUsers.add(view.user_email);
    }
  });

  const topChapters = Object.values(chapterStats)
    .map(stat => ({
      ...stat,
      uniqueUsers: stat.uniqueUsers.size
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const totalReaders = new Set(views.filter(v => v.user_email).map(v => v.user_email)).size;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-amber-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <TrendingUp className="w-5 h-5" />
          Community Reading Activity
        </CardTitle>
        <p className="text-sm text-stone-600">
          See what the community is reading right now
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <Eye className="w-6 h-6 text-amber-700 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-900">{views.length}</div>
            <div className="text-xs text-stone-600">Total Views</div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <Users className="w-6 h-6 text-amber-700 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-900">{totalReaders}</div>
            <div className="text-xs text-stone-600">Active Readers</div>
          </div>
        </div>

        {/* Top Chapters */}
        {topChapters.length > 0 && (
          <div>
            <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Most Read Chapters
            </h4>
            <div className="space-y-2">
              {topChapters.map((chapter, index) => (
                <motion.div
                  key={chapter.book_chapter}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-transparent rounded-lg border border-amber-900/10"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-600 text-white border-0">
                      {index + 1}
                    </Badge>
                    <div>
                      <div className="font-semibold text-stone-800">{chapter.book_chapter}</div>
                      <div className="text-xs text-stone-500">{chapter.uniqueUsers} readers</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-700">
                    <Eye className="w-4 h-4" />
                    <span className="font-semibold">{chapter.views}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}