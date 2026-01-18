import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Music2, BookOpen, TrendingUp, Loader2, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function RecommendationEngine({ currentChapter = null, userId = null }) {
  const [recommendations, setRecommendations] = useState({
    similarSongs: [],
    relatedChapters: [],
    newReleases: []
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Get user's interaction history
  const { data: userInteractions = [] } = useQuery({
    queryKey: ['userInteractions', userId],
    queryFn: async () => {
      if (!userId) return [];
      return base44.entities.UserInteraction.filter({ user_email: userId }, '-created_date', 50);
    },
    enabled: !!userId
  });

  // Get all chapters with music
  const { data: allChapters = [] } = useQuery({
    queryKey: ['chaptersWithMusic'],
    queryFn: async () => {
      const chapters = await base44.entities.BibleChapter.list('chronological_order', 1500);
      return chapters.filter(c => c.youtube_link);
    }
  });

  // Get GoodGodMusics releases
  const { data: musicReleases = [] } = useQuery({
    queryKey: ['musicReleases'],
    queryFn: () => base44.entities.MusicRelease.list('-release_date', 20)
  });

  // Generate AI-powered recommendations
  useEffect(() => {
    const generateRecommendations = async () => {
      if (allChapters.length === 0) return;
      
      setIsGenerating(true);

      try {
        // Build context about user preferences
        const userContext = {
          currentChapter: currentChapter ? {
            book: currentChapter.book,
            chapter: currentChapter.chapter_number,
            era: currentChapter.era,
            song: currentChapter.song_title,
            artist: currentChapter.song_artist
          } : null,
          likedSongs: userInteractions
            .filter(i => i.interaction_type === 'liked')
            .map(i => ({ title: i.song_title, artist: i.song_artist, chapter: i.chapter_reference })),
          playedChapters: userInteractions
            .filter(i => i.interaction_type === 'played')
            .map(i => ({ chapter: i.chapter_reference, song: i.song_title })),
          availableChapters: allChapters.slice(0, 100).map(c => ({
            book: c.book,
            chapter: c.chapter_number,
            era: c.era,
            song: c.song_title,
            artist: c.song_artist,
            themes: c.summary
          }))
        };

        // Use AI to generate personalized recommendations
        const aiResponse = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a music recommendation AI for a Christian Bible study platform called Bible Harmony. 
          
User Context:
${currentChapter ? `Currently viewing: ${currentChapter.book} ${currentChapter.chapter_number} (${currentChapter.era})` : ''}
${currentChapter?.song_title ? `Current song: "${currentChapter.song_title}" by ${currentChapter.song_artist}` : ''}

User's liked songs: ${userContext.likedSongs.length > 0 ? JSON.stringify(userContext.likedSongs.slice(0, 5)) : 'None yet'}
User's played chapters: ${userContext.playedChapters.length > 0 ? JSON.stringify(userContext.playedChapters.slice(0, 5)) : 'None yet'}

Available chapters with music: ${JSON.stringify(userContext.availableChapters.slice(0, 20))}

GoodGodMusics Releases: ${JSON.stringify(musicReleases.slice(0, 5).map(r => ({ title: r.title, themes: r.biblical_themes })))}

Based on this context, provide recommendations for:

1. SIMILAR_SONGS: 3-5 worship songs similar to what the user has engaged with (provide YouTube-searchable titles and artists)
2. RELATED_CHAPTERS: 3-5 Bible chapters from the available list that would resonate with the user's interests
3. GOODGODMUSICS_PICKS: 2-3 GoodGodMusics releases that match the user's preferences

Consider:
- Musical style and worship atmosphere
- Biblical themes and spiritual season
- Era and narrative connections in Scripture
- Emotional and theological resonance

Provide specific, actionable recommendations with brief explanations.`,
          response_json_schema: {
            type: "object",
            properties: {
              similar_songs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    artist: { type: "string" },
                    reason: { type: "string" },
                    youtube_search: { type: "string" }
                  }
                }
              },
              related_chapters: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    book: { type: "string" },
                    chapter: { type: "number" },
                    reason: { type: "string" }
                  }
                }
              },
              goodgodmusics_picks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    reason: { type: "string" }
                  }
                }
              }
            }
          }
        });

        // Match AI recommendations with actual data
        const matchedChapters = aiResponse.related_chapters?.map(rec => {
          const chapter = allChapters.find(c => 
            c.book === rec.book && c.chapter_number === rec.chapter
          );
          return chapter ? { ...chapter, aiReason: rec.reason } : null;
        }).filter(Boolean) || [];

        const matchedReleases = aiResponse.goodgodmusics_picks?.map(pick => {
          const release = musicReleases.find(r => 
            r.title.toLowerCase().includes(pick.title.toLowerCase())
          );
          return release ? { ...release, aiReason: pick.reason } : null;
        }).filter(Boolean) || [];

        setRecommendations({
          similarSongs: aiResponse.similar_songs || [],
          relatedChapters: matchedChapters,
          newReleases: matchedReleases
        });

      } catch (error) {
        console.error('Error generating recommendations:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (allChapters.length > 0 || musicReleases.length > 0) {
      generateRecommendations();
    }
  }, [currentChapter?.id, userInteractions.length, allChapters.length, musicReleases.length]);

  if (isGenerating && recommendations.similarSongs.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-purple-700 font-medium">AI is crafting personalized recommendations...</p>
      </div>
    );
  }

  const hasRecommendations = 
    recommendations.similarSongs.length > 0 || 
    recommendations.relatedChapters.length > 0 || 
    recommendations.newReleases.length > 0;

  if (!hasRecommendations) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-800">AI Recommendations</h2>
          <p className="text-stone-500 text-sm">Personalized for your spiritual journey</p>
        </div>
      </div>

      {/* Similar Songs */}
      {recommendations.similarSongs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3">
            <Music2 className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">Songs You Might Love</h3>
          </div>
          <div className="p-6 space-y-4">
            {recommendations.similarSongs.map((song, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-stone-800">{song.title}</h4>
                  <p className="text-sm text-stone-600">{song.artist}</p>
                  <p className="text-xs text-purple-700 mt-1 italic">{song.reason}</p>
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song.youtube_search || `${song.title} ${song.artist}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Related Chapters */}
      {recommendations.relatedChapters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">Chapters for You</h3>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {recommendations.relatedChapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-amber-600 text-white">{chapter.era}</Badge>
                </div>
                <h4 className="font-bold text-stone-800 mb-1">
                  {chapter.book} {chapter.chapter_number}
                </h4>
                {chapter.song_title && (
                  <p className="text-sm text-stone-600 mb-2">
                    🎵 {chapter.song_title}
                  </p>
                )}
                <p className="text-xs text-amber-700 italic">{chapter.aiReason}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* GoodGodMusics New Releases */}
      {recommendations.newReleases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-lg overflow-hidden border-2 border-pink-200"
        >
          <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-4 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white">New from GoodGodMusics</h3>
          </div>
          <div className="p-6 space-y-4">
            {recommendations.newReleases.map((release, index) => (
              <motion.div
                key={release.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                {release.cover_image_url ? (
                  <img
                    src={release.cover_image_url}
                    alt={release.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-stone-800">{release.title}</h4>
                  <p className="text-sm text-stone-600">{release.artist}</p>
                  <p className="text-xs text-pink-700 mt-1 italic">{release.aiReason}</p>
                  {release.biblical_themes && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {release.biblical_themes.slice(0, 3).map((theme, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-pink-200 text-pink-700">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {release.youtube_link && (
                    <a href={release.youtube_link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                        <Play className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  {release.spotify_link && (
                    <a href={release.spotify_link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-green-500 text-green-700">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}